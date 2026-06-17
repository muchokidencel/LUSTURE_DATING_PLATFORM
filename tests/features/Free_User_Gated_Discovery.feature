Feature: Free User Gated Discovery Page
  As a free user
  I want to access the discovery page
  So that I can see available profiles, but I should be prompted to upgrade to view details or access matches and likes

  Scenario: Free user can see discovery grid but cannot view individual profile details
    Given I am logged in as a free user
    And I navigate to "/discovery"
    Then I should see the discovery page header
    And I should see the profile card for "Sarah"
    When I click "View Profile" for "Sarah"
    Then I should see a friendly upgrade prompt modal
    And I should see a button "Upgrade to Premium"
    And I should not be redirected to the profile detail page

  Scenario: Free user cannot see matches count on profile and matches page is gated
    Given I am logged in as a free user
    And I navigate to "/profile"
    Then I should see the profile completion progress
    And the likes count and matches count should be locked or blurred
    When I navigate to "/matches"
    Then I should see a locked screen prompting me to upgrade to premium
