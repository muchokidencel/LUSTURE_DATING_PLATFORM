Feature: Premium Upgrade

  Scenario: Upgrading user profile to Gold tier using M-Pesa STK push
    Given I am logged in as a free user
    And I navigate to "/premium"
    When I enter M-Pesa phone number "0712345678"
    And I click the pay button
    Then I should see a message that the STK push was sent
