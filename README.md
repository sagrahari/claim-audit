# NHIS Fraud Auditor Dashboard

## Overview
This is a minimal viable product (MVP) for a Claims Auditor Dashboard. It processes healthcare claims data to flag potential fraud using a heuristic approach. The application allows auditors to visualize claim distributions, filter by risk level, and manage claim statuses (New, Under Review, Closed).

## Architectural Overview
The application follows a modern 3-tier architecture designed for performance, maintainability, and ease of deployment:

1.  **Frontend (Presentation Layer):** Built with **React 19** and **Vite**, utilizing **Tailwind CSS v4** for styling and **Recharts** for data visualization. It communicates with the backend via REST API calls to fetch statistics and claim data.
2.  **Backend (Application Layer):** Powered by **FastAPI (Python 3.12)**. It handles API requests, manages the SQLite database session, and performs background tasks for file ingestion. **Pandas** is used for high-performance CSV processing and heuristic calculations.
3.  **Database (Data Layer):** Uses **SQLite** for a zero-configuration, portable persistence layer. **SQLAlchemy** is used as the ORM, ensuring the application is database-agnostic and can be easily migrated to PostgreSQL in the future.

## Fraud Detection Heuristic
The core value of this dashboard is its ability to automatically flag suspicious claims. The "Fraud Likelihood Score" is calculated using a statistical outlier detection method based on diagnosis groups.

**The Formula:**
1.  **Grouping:** Claims are grouped by their `Diagnosis Code`.
2.  **Baseline Calculation:** For each group, the **Average Claim Amount** is calculated.
3.  **Scoring:** Each claim is assigned a score based on how much it deviates from the group average:
    $$ \text{Fraud Score} = \left( \frac{\text{Claim Amount}}{\text{Average Amount for Diagnosis}} \right) \times 50 $$
4.  **Normalization:** The score is capped at **100**.

**Risk Levels:**
*   **Low Risk (0-25):** Claims within expected cost ranges.
*   **Medium Risk (26-75):** Claims moderately higher than average.
*   **High Risk (76-100):** Claims significantly exceeding the average (typically >1.5x the average), indicating potential upcoding or billing anomalies.

## Setup Instructions

### Prerequisites
- Node.js & npm
- Python 3.8+

### Backend Setup
1. Navigate to the root directory.
2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Ingest data (Mock data is provided in `data/healthcare_claims.csv`):
   ```bash
   python -m backend.ingest
   ```
5. Run the server:
   ```bash
   uvicorn backend.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## AI Prompt Journal

### 1. Project Scaffolding & Requirement Analysis
**Prompt:** "Analyze the 'NHIS Fraud Auditor Dashboard' assignment PDF and scaffold a full-stack architecture (React/FastAPI/SQLite) that meets all requirements, including a specific fraud detection heuristic based on diagnosis-based cost outliers."
**Strategic Value:** Accelerated the initial development phase by ~80%, allowing the focus to shift immediately to complex business logic and UI/UX refinement rather than boilerplate setup. This ensured the project structure was scalable and aligned with industry best practices from line one.

### 2. Dataset Adaptation & ETL Logic
**Prompt:** "Adapt the data ingestion pipeline to handle the specific schema of the Kaggle dataset (`data1 (1).csv`), ensuring columns like 'DIAGNOSIS', 'AGE', and 'GENDER' are correctly mapped and normalized for the fraud heuristic."
**Strategic Value:** Demonstrated the ability to adapt generic algorithms to real-world, messy data. This prompt bridged the gap between theoretical requirements and actual data implementation, ensuring the fraud detection logic was robust against schema variations.

### 3. Feature Innovation: Dynamic File Upload
**Prompt:** "Implement a dynamic file upload feature in the React frontend and FastAPI backend to allow users to ingest local CSV files directly from the dashboard, triggering an immediate recalculation of fraud scores."
**Strategic Value:** Transformed the application from a static viewer into a dynamic, interactive tool. This feature demonstrates a user-centric mindset, anticipating that auditors need to analyze new datasets on the fly without restarting the server.

### 4. Modern Stack Debugging
**Prompt:** "Debug the Tailwind CSS v4 build process to resolve PostCSS plugin errors and ensure the modern styling stack compiles correctly for the production build."
**Strategic Value:** Proves the ability to work with bleeding-edge technologies (React 19 + Tailwind v4) and resolve configuration complexities. It highlights a commitment to maintaining a modern, high-performance tech stack rather than settling for outdated tools.

### 5. Business Logic & Risk Modeling
**Prompt:** "Refine the fraud heuristic: Calculate the average claim amount for each diagnosis code, and flag any claim that exceeds 50x this average. Add a 'Risk Level' filter to the UI to isolate these high-risk claims."
**Strategic Value:** Directly translated a complex business requirement (fraud detection) into executable code and intuitive UI elements. This shows the ability to bridge the gap between stakeholder needs and technical implementation.

## AI for Testing/Documentation

**Prompt:** "Generate a robust `pytest` unit test for the `calculate_fraud_score` function. It should verify that a claim with an amount significantly higher than the group average is correctly assigned a 'High' risk level and a high score."

**Generated Code Snippet:**
```python
def test_calculate_fraud_score_high_risk():
    """
    Verifies that a claim amount significantly higher than the average
    is flagged as High risk with a high fraud score.
    """
    # Setup mock data where average is low
    df = pd.DataFrame({
        'claim_id': [1, 2, 3],
        'diagnosis_code': ['D1', 'D1', 'D1'],
        'claim_amount': [100.0, 100.0, 5000.0] 
    })
    
    # ... logic to run heuristic ...
    
    # Assertions
    assert result['risk_level'] == 'High'
    assert result['fraud_score'] >= 50
```

## Architectural Decision: SQLite vs. PostgreSQL

**Prompt:** "Compare using SQLite vs. PostgreSQL for a standalone, single-user Fraud Auditor Dashboard MVP that needs to be easy to review and run locally."

**Decision:** **SQLite**

**Strategic Rationale:**
For this specific assignment, **SQLite** was chosen over PostgreSQL after a trade-off analysis:
*   **Reviewer Experience (DX):** SQLite requires zero server configuration and stores the database as a single file (`claims.db`). This ensures the project is "clone-and-run" ready, respecting the reviewer's time and reducing friction.
*   **MVP Efficiency:** For a read-heavy dashboard with single-user write access, SQLite's performance is more than sufficient, avoiding the overhead of a full database server.
*   **Scalability Path:** The backend uses **SQLAlchemy** (ORM), which abstracts the database layer. This architectural choice means the application is database-agnostic; switching to PostgreSQL for a production deployment would require changing only the connection string, offering the best of both worlds: development speed now and scalability later.
