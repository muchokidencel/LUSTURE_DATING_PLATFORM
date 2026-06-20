Feature: Withdrawal Flow
  As a referral affiliate
  I want to withdraw my available earnings
  So that I can receive my M-Pesa payout

  Scenario: User with sufficient balance withdraws successfully
    Given I am logged in as a premium user
    And the referral API returns dashboard stats
    And the referral earnings API shows available balance of 500
    When I navigate to "/referrals"
    And I click the withdraw button
    Then I should see a withdrawal success message

  Scenario: User with insufficient balance cannot withdraw
    Given I am logged in as a premium user
    And the referral API returns dashboard stats
    And the referral earnings API shows available balance of 200
    When I navigate to "/referrals"
    Then the withdraw button should be disabled
