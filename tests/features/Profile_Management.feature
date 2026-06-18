Feature: Profile Management
  As an authenticated user
  I want to manage my profile details and photos
  So that my dating profile is complete and attractive to matches

  Scenario: User edits profile bio and display name
    Given I am logged in as a premium user
    And I navigate to "/profile/edit"
    When I update the display name to "Alexander Lustre"
    And I update the bio to "Living life to the fullest"
    And I click "Save Changes"
    Then I should see a success confirmation

  Scenario: User uploads a profile photo
    Given I am logged in as a premium user
    And I navigate to "/profile/edit"
    When I upload a new profile photo
    Then the photo should appear in the profile photo grid

  Scenario: User deletes a profile photo
    Given I am logged in as a premium user
    And the user has existing photos in their profile
    And I navigate to "/profile/edit"
    When I delete a profile photo
    Then the photo should be removed from the grid
