Feature: Registration

  Scenario: Successful user registration
    Given I navigate to "/register"
    When I enter email "newuser@example.com" and password "password123"
    And I click the register button
    Then I should see the discovery page header
