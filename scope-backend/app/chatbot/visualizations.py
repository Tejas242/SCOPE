import base64
import io
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
import seaborn as sns
from datetime import datetime, timedelta
import json

from app.db.database import SessionLocal
from app.models.domain.complaint import Complaint, Category, Urgency


class VisualizationService:
    @staticmethod
    def _encode_fig_to_base64(fig: Figure) -> str:
        """Convert matplotlib figure to base64 encoded string"""
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
        buf.seek(0)
        img_data = buf.getvalue()
        plt.close(fig)  # Close the figure to free memory
        return base64.b64encode(img_data).decode('utf-8')

    @staticmethod
    def get_complaints_dataframe(db: Session, days: Optional[int] = None) -> pd.DataFrame:
        """Convert complaints from database to pandas DataFrame with filtering options"""
        query = db.query(Complaint)
        
        # Apply date filter if specified
        if days:
            cutoff_date = datetime.now() - timedelta(days=days)
            query = query.filter(Complaint.created_at >= cutoff_date)
            
        complaints = query.all()
        
        # Convert to DataFrame
        data = []
        for c in complaints:
            data.append({
                "id": c.id,
                "text": c.complaint_text,
                "category": str(c.category),
                "urgency": str(c.urgency),
                "status": c.status,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "assigned_to": c.assigned_to,
                "has_response": c.response is not None,
                "response_text": c.response
            })
            
        return pd.DataFrame(data)

    def generate_status_distribution_plot(self, time_period: Optional[int] = None) -> str:
        """Generate pie chart showing distribution of complaint statuses"""
        db = SessionLocal()
        try:
            df = self.get_complaints_dataframe(db, days=time_period)
            
            if df.empty:
                return "No complaints data available for visualization"
                
            # Create a pie chart for status distribution
            fig, ax = plt.subplots(figsize=(10, 6))
            status_counts = df['status'].value_counts()
            
            # Define custom colors for different statuses
            colors = {
                'Pending': '#FFC107',      # Amber
                'In Progress': '#2196F3',  # Blue
                'Resolved': '#4CAF50',     # Green
                'Closed': '#9E9E9E'        # Grey
            }
            
            status_colors = [colors.get(status, '#9C27B0') for status in status_counts.index]
            
            # Create the pie chart with percentage labels
            result = ax.pie(
                status_counts, 
                labels=list(status_counts.index),
                autopct='%1.1f%%',
                startangle=90,
                colors=status_colors,
                explode=[0.05] * len(status_counts),
                shadow=True
            )
            wedges, texts, autotexts = result if len(result) == 3 else (*result, None)
            
            # Customize text appearance
            plt.setp(autotexts, size=10, weight="bold", color="white")
            plt.setp(texts, size=12)
            
            # Add title and styling
            period_text = f"Last {time_period} Days" if time_period else "All Time"
            ax.set_title(f'Complaint Status Distribution ({period_text})', fontsize=16, pad=20)
            
            # Add total number as annotation
            ax.annotate(
                f'Total: {len(df)}',
                xy=(0, 0),
                xytext=(0.5, -0.1),
                textcoords='axes fraction',
                horizontalalignment='center',
                fontsize=12
            )
            
            fig.tight_layout()
            
            # Convert to base64 for display
            return self._encode_fig_to_base64(fig)
            
        except Exception as e:
            return f"Error generating status distribution plot: {str(e)}"
        finally:
            db.close()

    def generate_category_distribution_plot(self, time_period: Optional[int] = None) -> str:
        """Generate horizontal bar chart showing distribution of complaint categories"""
        db = SessionLocal()
        try:
            df = self.get_complaints_dataframe(db, days=time_period)
            
            if df.empty:
                return "No complaints data available for visualization"
                
            # Create a horizontal bar chart for category distribution
            fig, ax = plt.subplots(figsize=(12, 8))
            
            # Count categories and sort them
            category_counts = df['category'].value_counts().sort_values(ascending=True)
            
            # Create horizontal bar chart with custom colors
            bars = ax.barh(
                category_counts.index,
                np.array(category_counts.values),
                color='#5E35B1',  # Deep Purple
                alpha=0.8
            )
            
            # Add data labels to the end of each bar
            for bar in bars:
                width = bar.get_width()
                label_x_pos = width
                ax.text(label_x_pos, bar.get_y() + bar.get_height()/2, f' {width}',
                        va='center', fontsize=10)
            
            # Add percentage labels
            total = category_counts.sum()
            for i, (category, count) in enumerate(category_counts.items()):
                percentage = (count / total) * 100
                ax.text(
                    count / 2,  # x position in middle of bar
                    i,  # y position (category index)
                    f'{percentage:.1f}%',
                    va='center',
                    ha='center',
                    color='white',
                    fontweight='bold',
                    fontsize=11
                )
            
            # Remove spines and add grid
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.spines['bottom'].set_visible(False)
            ax.grid(axis='x', linestyle='--', alpha=0.7)
            
            # Add labels and title
            period_text = f"Last {time_period} Days" if time_period else "All Time"
            ax.set_title(f'Complaint Categories Distribution ({period_text})', fontsize=16, pad=20)
            ax.set_xlabel('Number of Complaints', fontsize=12)
            
            fig.tight_layout()
            
            # Convert to base64 for display
            return self._encode_fig_to_base64(fig)
            
        except Exception as e:
            return f"Error generating category distribution plot: {str(e)}"
        finally:
            db.close()

    def generate_urgency_distribution_plot(self, by_category: bool = False, time_period: Optional[int] = None) -> str:
        """Generate stacked bar or pie chart showing distribution of complaint urgencies"""
        db = SessionLocal()
        try:
            df = self.get_complaints_dataframe(db, days=time_period)
            
            if df.empty:
                return "No complaints data available for visualization"
            
            # Define colors for urgency levels
            urgency_colors = {
                'Critical': '#F44336',  # Red
                'High': '#FF9800',      # Orange
                'Medium': '#FFEB3B',    # Yellow
                'Low': '#4CAF50'        # Green
            }
            
            if not by_category:
                # Simple pie chart for urgency distribution
                fig, ax = plt.subplots(figsize=(10, 6))
                urgency_counts = df['urgency'].value_counts()
                
                # Map colors to urgency levels
                colors = [urgency_colors.get(urgency, '#9C27B0') for urgency in urgency_counts.index]
                
                # Create the pie chart
                result = ax.pie(
                    urgency_counts,
                    labels=list(urgency_counts.index),
                    autopct='%1.1f%%',
                    startangle=90,
                    colors=colors,
                    explode=[0.05] * len(urgency_counts),
                    shadow=True
                )
                wedges, texts, autotexts = result if len(result) == 3 else (*result, None)
                
                # Customize text appearance
                plt.setp(autotexts, size=10, weight="bold")
                plt.setp(texts, size=12)
                
                # Add title
                period_text = f"Last {time_period} Days" if time_period else "All Time"
                ax.set_title(f'Complaint Urgency Distribution ({period_text})', fontsize=16, pad=20)
            
            else:
                # Stacked bar chart of urgencies by category
                fig, ax = plt.subplots(figsize=(12, 8))
                
                # Create crosstab of category and urgency
                ct = pd.crosstab(df['category'], df['urgency'])
                
                # Ensure all urgency columns exist (even if 0)
                for urgency in ['Critical', 'High', 'Medium', 'Low']:
                    if urgency not in ct.columns:
                        ct[urgency] = 0
                
                # Sort columns from most urgent to least urgent
                ct = ct[['Critical', 'High', 'Medium', 'Low']]
                
                # Sort rows by total count
                ct = ct.loc[ct.sum(axis=1).sort_values(ascending=True).index]
                
                # Plot stacked bar chart
                ct.plot(
                    kind='barh',
                    stacked=True,
                    ax=ax,
                    color=[urgency_colors[col] for col in ct.columns],
                    width=0.7,
                    alpha=0.8
                )
                
                # Add total count at end of each bar
                for i, (category, row) in enumerate(ct.iterrows()):
                    total = row.sum()
                    ax.text(
                        total + 0.3,
                        i,
                        str(int(total)),
                        va='center',
                        fontsize=10,
                        fontweight='bold'
                    )
                
                # Remove spines and add grid
                ax.spines['top'].set_visible(False)
                ax.spines['right'].set_visible(False)
                ax.grid(axis='x', linestyle='--', alpha=0.7)
                
                # Add legend and title
                period_text = f"Last {time_period} Days" if time_period else "All Time"
                ax.set_title(f'Urgency Levels by Category ({period_text})', fontsize=16, pad=20)
                ax.set_xlabel('Number of Complaints', fontsize=12)
                ax.legend(title='Urgency Level', bbox_to_anchor=(1.05, 1), loc='upper left')
            
            fig.tight_layout()
            
            # Convert to base64 for display
            return self._encode_fig_to_base64(fig)
            
        except Exception as e:
            return f"Error generating urgency distribution plot: {str(e)}"
        finally:
            db.close()

    def generate_time_trend_plot(self, time_period: Optional[int] = 30, groupby: str = 'day') -> str:
        """Generate line chart showing complaint trends over time"""
        db = SessionLocal()
        try:
            # Get data with time constraints
            if time_period:
                cutoff_date = datetime.now() - timedelta(days=time_period)
                complaints = db.query(Complaint).filter(Complaint.created_at >= cutoff_date).all()
            else:
                complaints = db.query(Complaint).all()
                
            if not complaints:
                return "No complaints data available for the selected time period"
                
            # Convert to DataFrame for time-based analysis
            data = []
            for c in complaints:
                data.append({
                    "id": c.id,
                    "category": str(c.category),
                    "urgency": str(c.urgency),
                    "status": c.status,
                    "created_at": c.created_at
                })
            
            df = pd.DataFrame(data)
            
            # Add date columns for grouping
            df["date"] = pd.to_datetime(df["created_at"]).dt.date
            df["day"] = pd.to_datetime(df["created_at"]).dt.strftime("%Y-%m-%d")
            df["week"] = pd.to_datetime(df["created_at"]).dt.strftime("%Y-%U")
            df["month"] = pd.to_datetime(df["created_at"]).dt.strftime("%Y-%m")
            
            # Validate and set groupby parameter
            if groupby not in ['day', 'week', 'month']:
                groupby = 'day'  # Default to day if invalid
            
            # Group by selected time period
            counts = df.groupby(groupby).size().reset_index(name="count")
            
            # Create the time trend plot
            fig, ax = plt.subplots(figsize=(12, 6))
            
            # Plot with markers for each data point
            ax.plot(
                counts[groupby], 
                counts["count"],
                marker='o',
                linestyle='-',
                linewidth=2,
                markersize=8,
                color='#1976D2',  # Blue
                alpha=0.8
            )
            
            # Fill area under the curve
            ax.fill_between(
                counts[groupby],
                counts["count"],
                alpha=0.2,
                color='#1976D2'
            )
            
            # Add data labels above each point
            for i, (_, row) in enumerate(counts.iterrows()):
                ax.annotate(
                    str(row["count"]),
                    (row[groupby], row["count"]),
                    textcoords="offset points",
                    xytext=(0, 10),
                    ha='center'
                )
            
            # Add a trend line
            if len(counts) > 1:
                z = np.polyfit(range(len(counts)), counts["count"], 1)
                p = np.poly1d(z)
                ax.plot(
                    counts[groupby],
                    p(range(len(counts))),
                    "r--",
                    alpha=0.8,
                    label=f"Trend"
                )
            
            # Format x-axis labels based on groupby
            if groupby == 'day' and len(counts) > 10:
                # Rotate labels for better readability with many days
                plt.xticks(rotation=45, ha='right')
            elif groupby == 'month':
                # Format month labels
                labels = [pd.to_datetime(d).strftime('%b %Y') for d in counts[groupby]]
                ax.set_xticklabels(labels)
            
            # Compute average per time period
            avg_per_period = counts["count"].mean()
            ax.axhline(
                y=avg_per_period,
                color='green',
                linestyle=':',
                alpha=0.7,
                label=f"Avg: {avg_per_period:.1f}"
            )
            
            # Grid, title and labels
            ax.grid(True, linestyle='--', alpha=0.7)
            period_name = {'day': 'Daily', 'week': 'Weekly', 'month': 'Monthly'}[groupby]
            ax.set_title(f'{period_name} Complaint Volume Trend', fontsize=16, pad=20)
            ax.set_xlabel(period_name, fontsize=12)
            ax.set_ylabel('Number of Complaints', fontsize=12)
            
            # Add legend
            ax.legend()
            
            # Remove spines
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            
            fig.tight_layout()
            
            # Convert to base64 for display
            return self._encode_fig_to_base64(fig)
            
        except Exception as e:
            return f"Error generating time trend plot: {str(e)}"
        finally:
            db.close()

    def generate_category_comparison_plot(self, categories: List[str], metric: str = 'volume') -> str:
        """Generate comparison chart for selected categories"""
        db = SessionLocal()
        try:
            df = self.get_complaints_dataframe(db)
            
            if df.empty:
                return "No complaints data available for visualization"
                
            # Filter to only the requested categories
            df = df[df['category'].isin(categories)]
            
            if df.empty:
                return f"No complaints found for the categories: {', '.join(categories)}"
                
            # Set up the figure
            fig, ax = plt.subplots(figsize=(12, 8))
            
            if metric == 'volume':
                # Simple category volume comparison
                category_counts = df['category'].value_counts().reindex(categories).fillna(0)
                
                # Define a pleasing color palette
                colors = sns.color_palette("viridis", len(categories))
                
                # Create the bar chart
                bars = ax.bar(
                    category_counts.index,
                    np.array(category_counts.values),
                    color=colors,
                    width=0.6,
                    alpha=0.8
                )
                
                # Add data labels on top of bars
                for bar in bars:
                    height = bar.get_height()
                    ax.text(
                        bar.get_x() + bar.get_width()/2.,
                        height + 0.1,
                        f'{int(height)}',
                        ha='center', 
                        va='bottom',
                        fontsize=12,
                        fontweight='bold'
                    )
                
                # Add title and labels
                ax.set_title(f'Complaint Volume by Selected Categories', fontsize=16, pad=20)
                ax.set_ylabel('Number of Complaints', fontsize=12)
                
            elif metric == 'urgency':
                # Urgency comparison across categories
                urgency_order = ['Critical', 'High', 'Medium', 'Low']
                
                # Create a crosstab of categories and urgencies
                ct = pd.crosstab(df['category'], df['urgency']).reindex(categories)
                
                # Ensure all urgency columns exist
                for urgency in urgency_order:
                    if urgency not in ct.columns:
                        ct[urgency] = 0
                
                # Reorder columns by urgency severity
                ct = ct[urgency_order]
                
                # Calculate the percentage of each urgency level within each category
                ct_pct = ct.div(ct.sum(axis=1), axis=0).fillna(0) * 100
                
                # Define colors for urgency levels
                urgency_colors = {
                    'Critical': '#F44336',  # Red
                    'High': '#FF9800',      # Orange
                    'Medium': '#FFEB3B',    # Yellow
                    'Low': '#4CAF50'        # Green
                }
                color_list = [urgency_colors[urgency] for urgency in urgency_order]
                
                # Plot stacked percentage bars
                ct_pct.plot(
                    kind='bar',
                    stacked=True,
                    ax=ax,
                    color=color_list,
                    width=0.7,
                    alpha=0.8
                )
                
                # Add category totals above each bar
                for i, (category, _) in enumerate(ct.iterrows()):
                    total = ct.at[category, :].sum()
                    ax.text(
                        i,
                        105,  # Position above 100%
                        f'n={total}',
                        ha='center',
                        va='bottom',
                        fontsize=11,
                        fontweight='bold'
                    )
                
                # Add title and labels
                ax.set_title(f'Urgency Distribution by Selected Categories', fontsize=16, pad=20)
                ax.set_ylabel('Percentage of Complaints', fontsize=12)
                ax.set_ylim(0, 115)  # Leave room for total labels
                
                # Move legend out of the plot
                ax.legend(
                    title='Urgency Level',
                    bbox_to_anchor=(1.05, 1),
                    loc='upper left'
                )
                
            elif metric == 'status':
                # Status comparison across categories
                status_order = ['Pending', 'In Progress', 'Resolved', 'Closed']
                
                # Create a crosstab of categories and statuses
                ct = pd.crosstab(df['category'], df['status']).reindex(categories)
                
                # Ensure all status columns exist
                for status in status_order:
                    if status not in ct.columns:
                        ct[status] = 0
                
                # Reorder columns by status progression
                ct = ct[status_order]
                
                # Calculate the percentage of each status within each category
                ct_pct = ct.div(ct.sum(axis=1), axis=0).fillna(0) * 100
                
                # Define colors for status
                status_colors = {
                    'Pending': '#FFC107',      # Amber
                    'In Progress': '#2196F3',  # Blue
                    'Resolved': '#4CAF50',     # Green
                    'Closed': '#9E9E9E'        # Grey
                }
                color_list = [status_colors[status] for status in status_order]
                
                # Plot stacked percentage bars
                ct_pct.plot(
                    kind='bar',
                    stacked=True,
                    ax=ax,
                    color=color_list,
                    width=0.7,
                    alpha=0.8
                )
                
                # Add category totals above each bar
                for i, (category, _) in enumerate(ct.iterrows()):
                    total = ct.at[category, :].sum()
                    ax.text(
                        i,
                        105,  # Position above 100%
                        f'n={total}',
                        ha='center',
                        va='bottom',
                        fontsize=11,
                        fontweight='bold'
                    )
                
                # Add title and labels
                ax.set_title(f'Status Distribution by Selected Categories', fontsize=16, pad=20)
                ax.set_ylabel('Percentage of Complaints', fontsize=12)
                ax.set_ylim(0, 115)  # Leave room for total labels
                
                # Move legend out of the plot
                ax.legend(
                    title='Status',
                    bbox_to_anchor=(1.05, 1),
                    loc='upper left'
                )
            
            # Remove top and right spines
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            
            # Add grid for readability
            ax.grid(axis='y', linestyle='--', alpha=0.7)
            
            fig.tight_layout()
            
            # Convert to base64 for display
            return self._encode_fig_to_base64(fig)
            
        except Exception as e:
            return f"Error generating category comparison plot: {str(e)}"
        finally:
            db.close()

    def generate_resolution_time_plot(self, time_period: Optional[int] = None) -> str:
        """Generate box plot showing resolution time by category"""
        db = SessionLocal()
        try:
            # Get all resolved/closed complaints
            query = db.query(Complaint).filter(Complaint.status.in_(["Resolved", "Closed"]))
            
            # Apply time filter if specified
            if time_period:
                cutoff_date = datetime.now() - timedelta(days=time_period)
                query = query.filter(Complaint.updated_at >= cutoff_date)
                
            complaints = query.all()
            
            if not complaints:
                return "No resolved complaints data available for visualization"
            
            # Calculate resolution time for each complaint
            data = []
            for c in complaints:
                # Skip if missing timestamps
                if c.created_at is None or c.updated_at is None:
                    continue
                    
                # Calculate resolution time in hours
                resolution_time = (c.updated_at - c.created_at).total_seconds() / 3600
                
                data.append({
                    "id": c.id,
                    "category": str(c.category),
                    "urgency": str(c.urgency),
                    "resolution_time": resolution_time,
                    "resolution_days": resolution_time / 24  # Convert to days
                })
            
            if not data:
                return "No valid resolution time data available"
                
            df = pd.DataFrame(data)
            
            # Create figure
            fig, ax = plt.subplots(figsize=(12, 8))
            
            # Use seaborn for better boxplot
            sns.set_style("whitegrid")
            
            # Create boxplot grouped by category
            sns.boxplot(
                x="category",
                y="resolution_days",
                data=df,
                ax=ax,
                palette="viridis",
                width=0.6,
                showmeans=True,
                meanprops={"marker":"o", "markerfacecolor":"white", "markeredgecolor":"black", "markersize":"10"}
            )
            
            # Add individual data points for better visualization
            sns.stripplot(
                x="category",
                y="resolution_days",
                data=df,
                ax=ax,
                size=4,
                color=".3",
                alpha=0.6
            )
            
            # Add a line for the overall mean
            overall_mean = df["resolution_days"].mean()
            ax.axhline(y=overall_mean, color='red', linestyle='--', alpha=0.7, 
                       label=f'Overall Mean: {overall_mean:.1f} days')
            
            # Add stats as text annotations for each category
            categories = df["category"].unique()
            for i, category in enumerate(categories):
                category_data = df[df["category"] == category]["resolution_days"]
                if len(category_data) > 0:
                    # Calculate stats
                    mean_days = category_data.mean()
                    median_days = category_data.median()
                    count = len(category_data)
                    
                    # Add text below the boxplot
                    ax.text(
                        i, -0.3, 
                        f'Mean: {mean_days:.1f}d\nMedian: {median_days:.1f}d\nn={count}',
                        horizontalalignment='center',
                        size='small',
                        color='black',
                        weight='semibold'
                    )
            
            # Set titles and labels
            period_text = f"Last {time_period} Days" if time_period else "All Time"
            ax.set_title(f'Resolution Time by Category ({period_text})', fontsize=16, pad=20)
            ax.set_xlabel('Category', fontsize=12)
            ax.set_ylabel('Resolution Time (days)', fontsize=12)
            
            # Add legend
            ax.legend()
            
            # Set y-axis to start slightly below 0 to make room for annotations
            y_min, y_max = ax.get_ylim()
            ax.set_ylim(bottom=-0.8, top=y_max * 1.1)
            
            fig.tight_layout()
            
            # Convert to base64 for display
            return self._encode_fig_to_base64(fig)
            
        except Exception as e:
            return f"Error generating resolution time plot: {str(e)}"
        finally:
            db.close()
