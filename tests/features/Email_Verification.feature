Feature: Email Verification
  As a new user
  I want to verify my email address during registration
  So that my account is securely authenticated before access is granted

  Scenario: Successful registration with email verification
    Given I am on the registration page
    When I enter registration email "newuser@lustre.com" and click send verification code
    Then I should see the verification code input
    When I enter verification code "123456" and click confirm
    Then I should see the password input
    When I enter password "securepass123" and click create account
    Then I should be redirected to the discovery page

  Scenario: Duplicate email is rejected at OTP stage
    Given I am on the registration page
    When I enter a duplicate email "existing@lustre.com" and click send verification code
    Then I should see error message "User already exists"

  Scenario: Invalid verification code is rejected
    Given I am on the registration page
    When I enter registration email "newuser@lustre.com" and click send verification code
    Then I should see the verification code input
    When I enter an invalid short code "1234"
    Then I should see error message "Verification code must be 6 characters"

  Scenario: Resend code cooldown timer
    Given I am on the registration page
    When I enter registration email "newuser@lustre.com" and click send verification code
    Then I should see the verification code input
    And the resend button should show a countdown timer

  Scenario: Back navigation preserves form state
    Given I am on the registration page
    When I enter registration email "newuser@lustre.com" and click send verification code
    Then I should see the verification code input
    When I click back to email step
    Then the email field should contain "newuser@lustre.com"
