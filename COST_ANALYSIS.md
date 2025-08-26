# HackSaathi - AI Feature Cost Analysis

This document provides a cost estimation for using a paid Gemini API for the AI features in the HackSaathi application. The analysis is based on the "Hybrid Algorithm + AI" model for the PeerJet search feature, which significantly reduces costs.

## Pricing Model

The calculations are based on the **Gemini 2.5 Flash** model at the following price:
- **$0.40 per 1,000,000 tokens**

*Note: Tokens are small pieces of words. 1,000 tokens is roughly equivalent to 750 words.*

## Cost Per Feature (Token Usage)

This is an estimation of the number of tokens consumed for a single use of each AI feature.

- **`proctorText` (Checking a name or bio):**
  - **Estimated Total:** ~425 tokens per check.
  - Very low cost.

- **`proctorImage` (Checking a profile photo):**
  - **Estimated Total:** ~175 tokens + image processing cost.
  - Very low cost for the text portion.

- **`generateBio` (AI-generated bio):**
  - **Estimated Total:** ~325 tokens per bio.
  - Low cost.

- **`findPeers` (PeerJet AI Search):**
  - This is the primary cost driver.
  - The app uses a hybrid model: a local algorithm finds the top 5 candidates, and only those 5 are sent to the AI for final ranking.
  - **Estimated Total:** ~1,550 tokens per search.

## Total Cost Per User Session

Assuming a new user signs up and uses every feature once, including 3 PeerJet searches:

- **Onboarding (Proctoring + Bio):** ~1,375 tokens
- **PeerJet Searches (3x):** 3 * 1,550 = 4,650 tokens
- **Total Estimated Tokens Per User:** **~6,025 tokens**

## Scaled Cost Scenarios

These scenarios project the daily cost based on the number of active users, assuming each user has one full session as described above.

### Scenario 1: 500 Active Users per Day

-   **Total Daily Tokens:** 500 users * 6,025 tokens/user = **3,012,500 tokens**
-   **Calculation:** `(3,012,500 / 1,000,000) * $0.40`
-   **Estimated Daily Cost: $1.21**

With a $300 new user credit from Google Cloud, this usage level would be covered for **approximately 247 days**.

### Scenario 2: 1,000 Active Users per Day

-   **Total Daily Tokens:** 1,000 users * 6,025 tokens/user = **6,025,000 tokens**
-   **Calculation:** `(6,025,000 / 1,000,000) * $0.40`
-   **Estimated Daily Cost: $2.41**

With a $300 new user credit from Google Cloud, this usage level would be covered for **approximately 124 days**.

## Conclusion

The hybrid approach for the PeerJet search feature makes the application's AI costs extremely manageable and affordable. The $300 in free credits provided by Google Cloud creates a long runway (several months) for the app to grow its user base before any out-of-pocket expenses would be required. This architecture is scalable and cost-effective for a production environment.
