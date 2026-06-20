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

  Scenario: Premium user requests to connect and waits for mutual consent
    Given I am logged in as a premium user
    And I have a match who has not yet consented to reveal contact details
    When I navigate to "/matches"
    And I open the connect dialog for my match
    Then I should see a request to connect prompt
    When I request to connect with my match
    Then I should see a waiting for mutual consent message
