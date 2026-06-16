Feature: Paystack Payment & Subscription Upgrade

  Scenario: Upgrading user profile to basic tier using Paystack credit card payment
    Given I am logged in as a free user
    And I navigate to "/premium"
    When I click the Paystack payment option
    And I click the pay button for Paystack
    Then I should be redirected to the Paystack checkout page
    And after completing transaction "PAY-TEST-100" I should be redirected to "/premium"
    And my account tier should be upgraded to premium basic
