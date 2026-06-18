Feature: Referral Dashboard
  As an authenticated user
  I want to view my referral dashboard
  So that I can track my referrals, earnings, and share my referral link

  Scenario: User views referral dashboard stats
    Given I am logged in as a premium user
    And the referral API returns dashboard stats
    When I navigate to "/referrals"
    Then I should see total referrals count
    And I should see conversion rate percentage
    And I should see total earnings amount

  Scenario: User copies referral link
    Given I am logged in as a premium user
    And the referral API returns dashboard stats
    And the referral link API returns a valid link
    When I navigate to "/referrals"
    And I click the copy referral link button
    Then the referral link should be copied to clipboard

  Scenario: User views referral activity feed
    Given I am logged in as a premium user
    And the referral API returns dashboard stats
    And the referral activity API returns recent events
    When I navigate to "/referrals"
    Then I should see the activity feed section
    And I should see a signup event in the feed
