Feature: Like Notifications

  Scenario: Clicking the notifications bell shows received notifications
    Given I have received notifications
    And I navigate to "/discovery"
    When I click the notifications bell
    Then I should see a notification "Jane liked your profile!"
