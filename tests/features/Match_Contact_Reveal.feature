Feature: Match Contact Reveal
  As a matched user
  I want to see my match's contact details
  So that I can connect with them outside the platform

  Scenario: Premium user sees match contacts on matches page
    Given I am logged in as a premium user
    And I have mutual matches with contact details
    When I navigate to "/matches"
    Then I should see the matches list
    And I should see WhatsApp contact for my match
    And I should see Instagram contact for my match

  Scenario: Free user sees locked matches page
    Given I am logged in as a free user
    When I navigate to "/matches"
    Then I should see a locked screen prompting me to upgrade to premium
