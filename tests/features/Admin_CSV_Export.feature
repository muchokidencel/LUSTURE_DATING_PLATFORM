Feature: Admin CSV Export

  Scenario: Admin exports the user list as a CSV file
    Given I am logged in as an admin user
    And I navigate to "/admin"
    When I click "Export Users CSV"
    Then a CSV file download should be initiated

  Scenario: Admin exports commission data as a CSV file
    Given I am logged in as an admin user
    And I navigate to "/admin"
    When I click "Export Commissions CSV"
    Then a CSV file download should be initiated
