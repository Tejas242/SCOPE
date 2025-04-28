import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
from pathlib import Path
import os
from app.core.config import settings
from app.models.domain.complaint import Category, Urgency
from sklearn.preprocessing._label import LabelEncoder as LabelEncoderClass


class MultiTaskModel(nn.Module):
    def __init__(self, num_genres, num_priority):
        super().__init__()
        self.enc = AutoModel.from_pretrained(settings.MODEL)
        h = self.enc.config.hidden_size
        self.drop = nn.Dropout(0.3)
        self.head_cat = nn.Linear(h, num_genres)
        self.head_urg = nn.Linear(h, num_priority)
        
    def forward(self, input_ids, attention_mask, token_type_ids=None):
        x = self.enc(input_ids, attention_mask=attention_mask)[0][:,0]
        x = self.drop(x)
        return self.head_cat(x), self.head_urg(x)


class ModelPredictor:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.tokenizer = AutoTokenizer.from_pretrained(settings.MODEL)
        # Add safe globals for model loading
        torch.serialization.add_safe_globals([
            LabelEncoderClass
        ])
        
        # Load the model
        model_path = Path(settings.MODEL_PATH)
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path}")
        
        try:
            # Load checkpoint with label encoders
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
            
            # Get label encoders
            self.le_cat = checkpoint.get('le_cat')
            self.le_urg = checkpoint.get('le_urg')
            
            if self.le_cat is None or self.le_urg is None:
                raise ValueError("Label encoders not found in model file")
            
            # Initialize model with correct output sizes
            self.model = MultiTaskModel(
                num_genres=len(self.le_cat.classes_), 
                num_priority=len(self.le_urg.classes_)
            )
            
            # Load state dict
            self.model.load_state_dict(checkpoint['state'])
            self.model.to(self.device)
            self.model.eval()
            
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise
        
        # Map from enum to string for predictions
        self.category_values = {cat.value for cat in Category}
        self.urgency_values = {urg.value for urg in Urgency}
    
    def predict(self, text):
        """Predict category and urgency for a complaint text"""
        # Tokenize input text
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512
        ).to(self.device)
        
        with torch.no_grad():
            # Get model predictions
            category_logits, urgency_logits = self.model(**inputs)
            
            # Get predicted class indices
            category_idx = category_logits.argmax(1).item()
            urgency_idx = urgency_logits.argmax(1).item()
            
            # Calculate confidences
            category_probs = torch.softmax(category_logits, dim=1)
            urgency_probs = torch.softmax(urgency_logits, dim=1)
            confidence_category = category_probs[0][int(category_idx)].item()
            confidence_urgency = urgency_probs[0][int(urgency_idx)].item()
            
            # Map indices to original labels using label encoders
            try:
                category = self.le_cat.inverse_transform([category_idx])[0]
                urgency = self.le_urg.inverse_transform([urgency_idx])[0]
                
                # Convert to valid enum values if necessary
                if category not in self.category_values:
                    category = "Other"
                if urgency not in self.urgency_values:
                    urgency = "Medium"
            except Exception as e:
                print(f"Error in prediction post-processing: {e}")
                category = "Other"
                urgency = "Medium"
            
            return {
                "category": category,
                "urgency": urgency,
                "confidence_category": confidence_category,
                "confidence_urgency": confidence_urgency
            }


# Singleton instance
model_predictor = None


def get_model_predictor():
    """Get or create model predictor singleton"""
    global model_predictor
    if model_predictor is None:
        try:
            model_predictor = ModelPredictor()
            print("Model predictor initialized successfully")
        except Exception as e:
            print(f"Failed to initialize model predictor: {str(e)}")
            # Return a dummy model predictor that always returns defaults
            class DummyPredictor:
                def predict(self, text):
                    return {
                        "category": "Other",
                        "urgency": "Medium",
                        "confidence_category": 1.0,
                        "confidence_urgency": 1.0
                    }
            model_predictor = DummyPredictor()
            print("Using dummy predictor as fallback")
    return model_predictor
