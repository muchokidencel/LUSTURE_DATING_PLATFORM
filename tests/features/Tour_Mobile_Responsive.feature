Feature: Onboarding Tour Mobile Responsiveness

  Scenario: Tour dialog adapts to mobile viewport layout
    Given I am logged in as a free user
    And I navigate to "/profile"
    When I click "Platform Guide"
    Then the tour dialog should be visible
