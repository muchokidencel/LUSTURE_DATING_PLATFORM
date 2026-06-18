Feature: Referral Commission Tracking
  As a referral affiliate
  I want to see my earnings breakdown
  So that I know how much is available vs pending

  Scenario: User views available and pending earnings breakdown
    Given I am logged in as a premium user
    And the referral earnings API returns a breakdown
    And the referral API returns dashboard stats
    When I navigate to "/referrals"
    Then I should see the available earnings amount
    And I should see the pending earnings amount

  Scenario: User sees updated pending amount after referral conversion
    Given I am logged in as a premium user
    And the referral earnings API returns updated pending earnings
    And the referral API returns dashboard stats
    When I navigate to "/referrals"
    Then I should see the updated pending earnings reflecting the new conversion
