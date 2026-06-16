Feature: Registration

  Scenario: Successful user registration with email verification
    Given I navigate to "/register"
    When I enter registration email "newuser@example.com"
    And I click the send verification code button
    Then I should see the verification code input field
    When I enter verification code "123456" and click verify
    Then I should see the password setup field
    When I enter registration password "password123" and click register
    Then I should see the discovery page header
