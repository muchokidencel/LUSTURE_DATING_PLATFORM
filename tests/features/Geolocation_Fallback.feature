Feature: Geolocation Privacy and Fallback

  Scenario: Live location access fails and user falls back to manual City input
    Given I am logged in as a premium user
    And I navigate to "/profile/edit"
    Then I should see the "Share Live Location" button
    When I click the "Share Live Location" button and it fails
    Then I should see a manual City input field
    When I enter city "Mombasa"
    And I click "Save Changes"
    Then my profile city should be updated to "Mombasa"
