Feature: Matchmaking Age Slider

  Scenario: Filtering the recommendations feed by age using the dual-range slider
    Given I am logged in as a premium user
    And I navigate to "/matching"
    Then I should see the age range filter label
    When I adjust the age range slider to 25 and 30
    Then the feed should only display profiles within the age bracket 25 to 30
