Feature: Discovery Filtering

  Scenario: Filtering users in discovery grid
    Given I am logged in as a premium user
    And I navigate to "/discovery"
    When I filter by gender "Female"
    Then I should only see profiles with gender "Female"
