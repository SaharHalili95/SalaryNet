#!/usr/bin/env python3
"""End-to-end smoke test: exercises every user action against a running SalaryNet API.

Usage:
    python3 scripts/smoke_test.py [base_url]        # default http://localhost:5080

Run it against a freshly seeded database (demo data enabled). It creates its own
records with unique names, so it can be repeated, and exits non-zero on any failure.
Only the Python standard library is used.
"""

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import date

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5080").rstrip("/")
RUN = str(int(time.time()))
ADMIN = ("admin@salarynet.demo", "Admin1234")
HR = ("hr@salarynet.demo", "Demo123!")
EMPLOYEE = ("noa.cohen@salarynet.demo", "Demo123!")

results: list[tuple[str, str, bool, str]] = []


def call(method, path, token=None, body=None):
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(BASE + path, data=data, method=method)
    request.add_header("Accept", "application/json")
    if data is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
            content_type = response.headers.get("Content-Type", "")
            payload = json.loads(raw) if raw and "json" in content_type else (raw.decode() if raw else None)
            return response.status, payload, content_type
    except urllib.error.HTTPError as error:
        raw = error.read()
        try:
            payload = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            payload = raw.decode(errors="replace")
        return error.code, payload, error.headers.get("Content-Type", "")


def check(area, name, condition, detail=""):
    results.append((area, name, bool(condition), detail))


def expect(area, name, method, path, status, token=None, body=None):
    code, payload, content_type = call(method, path, token, body)
    detail = f"expected {status}, got {code}"
    if code >= 400 and "problem+json" not in content_type:
        detail += " (not ProblemDetails)"
        check(area, name, False, detail)
    else:
        check(area, name, code == status, detail)
    return payload


def login(credentials):
    code, payload, _ = call("POST", "/api/auth/login", body={"email": credentials[0], "password": credentials[1]})
    return payload["accessToken"] if code == 200 else None


def main():
    today = date.today()
    year, month = today.year, today.month
    next_year, next_month = (year + 1, 1) if month == 12 else (year, month + 1)

    # Anonymous
    check("Anonymous", "Health endpoint", call("GET", "/health")[0] == 200)
    expect("Anonymous", "Wrong password is rejected", "POST", "/api/auth/login", 401,
           body={"email": HR[0], "password": "Wrong1234"})
    expect("Anonymous", "Protected API needs a token", "GET", "/api/employees", 401)

    admin, hr, emp = login(ADMIN), login(HR), login(EMPLOYEE)
    check("Anonymous", "Admin, HR and employee demo accounts sign in", admin and hr and emp)
    if not (admin and hr and emp):
        return report()

    # Admin: users and departments
    expect("Admin", "View own profile", "GET", "/api/auth/me", 200, admin)
    expect("Admin", "List users", "GET", "/api/users", 200, admin)
    expect("Admin", "Weak password is rejected", "POST", "/api/users", 400, admin,
           {"email": f"weak{RUN}@smoke.test", "password": "password", "role": "HR", "displayName": "Weak"})
    tester = expect("Admin", "Create an HR account", "POST", "/api/users", 201, admin,
                    {"email": f"tester{RUN}@smoke.test", "password": "Start123", "role": "HR", "displayName": "Smoke Tester"})
    expect("Admin", "Duplicate account email is rejected", "POST", "/api/users", 409, admin,
           {"email": f"tester{RUN}@smoke.test", "password": "Start123", "role": "HR", "displayName": "Again"})
    dept = expect("Admin", "Create a department", "POST", "/api/departments", 201, admin,
                  {"name": f"Smoke {RUN}", "description": "temporary"})
    expect("Admin", "Duplicate department name is rejected", "POST", "/api/departments", 409, admin, {"name": f"Smoke {RUN}"})
    expect("Admin", "Rename a department", "PUT", f"/api/departments/{dept['id']}", 200, admin,
           {"name": f"Smoke {RUN} renamed", "description": "temporary"})
    expect("Admin", "Delete an empty department", "DELETE", f"/api/departments/{dept['id']}", 204, admin)
    departments = expect("Admin", "List departments", "GET", "/api/departments", 200, admin)
    busy = next(d for d in departments if d["employeeCount"] > 0)
    expect("Admin", "Department with employees cannot be deleted", "DELETE", f"/api/departments/{busy['id']}", 409, admin)
    me = call("GET", "/api/auth/me", admin)[1]
    expect("Admin", "Admin cannot deactivate themselves", "POST", f"/api/users/{me['id']}/deactivate", 422, admin)
    expect("Admin", "Dashboard summary", "GET", "/api/dashboard/summary", 200, admin)

    # Account security: lockout, unlock, reset, deactivate
    tester_login = (f"tester{RUN}@smoke.test", "Start123")
    for _ in range(5):
        call("POST", "/api/auth/login", body={"email": tester_login[0], "password": "Wrong1234"})
    expect("Security", "Five failures lock the account", "POST", "/api/auth/login", 401,
           body={"email": tester_login[0], "password": tester_login[1]})
    unlocked = expect("Security", "Admin unlocks the account", "POST", f"/api/users/{tester['id']}/unlock", 200, admin)
    check("Security", "Unlocked account is no longer flagged", unlocked and not unlocked["isLockedOut"])
    expect("Security", "Unlocked account can sign in", "POST", "/api/auth/login", 200,
           body={"email": tester_login[0], "password": tester_login[1]})
    expect("Security", "Admin resets the password", "POST", f"/api/users/{tester['id']}/reset-password", 200, admin,
           {"newPassword": "Reset1234"})
    expect("Security", "Old password stops working", "POST", "/api/auth/login", 401,
           body={"email": tester_login[0], "password": tester_login[1]})
    expect("Security", "New password works", "POST", "/api/auth/login", 200,
           body={"email": tester_login[0], "password": "Reset1234"})
    expect("Security", "Admin deactivates the account", "POST", f"/api/users/{tester['id']}/deactivate", 200, admin)
    expect("Security", "Deactivated account cannot sign in", "POST", "/api/auth/login", 401,
           body={"email": tester_login[0], "password": "Reset1234"})
    expect("Security", "HR cannot manage users", "GET", "/api/users", 403, hr)
    expect("Security", "HR cannot change departments", "POST", "/api/departments", 403, hr, {"name": "Nope"})

    # HR: employees
    page = expect("HR", "Search employees (paged, sorted)", "GET",
                  "/api/employees?pageSize=5&sortBy=BaseSalary&sortDirection=Desc&isActive=true", 200, hr)
    salaries = [e["baseSalary"] for e in page["items"]]
    check("HR", "Sorting by salary is descending", salaries == sorted(salaries, reverse=True))
    expect("HR", "Page size over 100 is rejected", "GET", "/api/employees?pageSize=500", 400, hr)
    new_employee = {"firstName": "Smoke", "lastName": f"Test{RUN}", "email": f"smoke{RUN}@smoke.test",
                    "departmentId": busy["id"], "baseSalary": 15000, "employmentType": "FullTime"}
    created = expect("HR", "Create an employee", "POST", "/api/employees", 201, hr, new_employee)
    expect("HR", "Duplicate email (different case) is rejected", "POST", "/api/employees", 409, hr,
           {**new_employee, "email": new_employee["email"].upper()})
    expect("HR", "Invalid employee is rejected per field", "POST", "/api/employees", 400, hr,
           {**new_employee, "firstName": "", "email": "bad", "baseSalary": -1})
    expect("HR", "Edit an employee", "PUT", f"/api/employees/{created['id']}", 200, hr, {**new_employee, "baseSalary": 16500})
    expect("HR", "Deactivate an employee", "POST", f"/api/employees/{created['id']}/deactivate", 204, hr)
    expect("HR", "Deactivating twice is refused", "POST", f"/api/employees/{created['id']}/deactivate", 422, hr)
    expect("HR", "Reactivate an employee", "POST", f"/api/employees/{created['id']}/activate", 204, hr)

    # HR: payroll
    single = expect("Payroll", "Generate a single payslip", "POST", "/api/payroll", 201, hr,
                    {"employeeId": created["id"], "year": year, "month": month, "bonus": 500})
    check("Payroll", "Gross - deductions = net",
          single and round(single["grossSalary"] - single["deductions"], 2) == round(single["netSalary"], 2))
    expect("Payroll", "Same period twice is refused", "POST", "/api/payroll", 409, hr,
           {"employeeId": created["id"], "year": year, "month": month, "bonus": 0})
    expect("Payroll", "Future period is refused", "POST", "/api/payroll", 422, hr,
           {"employeeId": created["id"], "year": next_year, "month": next_month, "bonus": 0})
    first_run = expect("Payroll", "Run monthly payroll", "POST", "/api/payroll/run", 200, hr, {"year": year, "month": month})
    second_run = expect("Payroll", "Monthly run is safe to repeat", "POST", "/api/payroll/run", 200, hr, {"year": year, "month": month})
    check("Payroll", "Repeat run generates nothing new", second_run and second_run["generated"] == 0,
          f"first {first_run}, second {second_run}")
    expect("Payroll", "List payslips with filters", "GET", f"/api/payroll?year={year}&month={month}", 200, hr)
    expect("Payroll", "Open a payslip", "GET", f"/api/payroll/{single['id']}", 200, hr)
    expect("Payroll", "HR cannot clock in", "POST", "/api/attendance/check-in", 403, hr)
    expect("Payroll", "HR sees all attendance", "GET", "/api/attendance", 200, hr)

    # Employee self-service
    expect("Employee", "View own employee record", "GET", "/api/employees/me", 200, emp)
    expect("Employee", "Employee list is blocked", "GET", "/api/employees", 403, emp)
    expect("Employee", "Dashboard is blocked", "GET", "/api/dashboard/summary", 403, emp)
    own = expect("Employee", "List own payslips with a spoofed filter", "GET",
                 f"/api/payroll?employeeId={created['id']}&pageSize=100", 200, emp)
    my_id = call("GET", "/api/employees/me", emp)[1]["id"]
    check("Employee", "Spoofed filter still returns only own payslips",
          own and own["items"] and all(p["employeeId"] == my_id for p in own["items"]))
    expect("Employee", "Someone else's payslip is hidden (404)", "GET", f"/api/payroll/{single['id']}", 404, emp)
    expect("Employee", "Generating payroll is blocked", "POST", "/api/payroll", 403, emp,
           {"employeeId": my_id, "year": year, "month": month, "bonus": 0})

    # Attendance
    expect("Attendance", "Check in", "POST", "/api/attendance/check-in", 200, emp)
    expect("Attendance", "Second check-in is refused", "POST", "/api/attendance/check-in", 409, emp)
    expect("Attendance", "Current shift is shown", "GET", "/api/attendance/current", 200, emp)
    closed = expect("Attendance", "Check out", "POST", "/api/attendance/check-out", 200, emp)
    check("Attendance", "Hours are calculated by the server", closed and closed["totalHours"] >= 0 and not closed["isOpen"])
    expect("Attendance", "Check-out without a shift is refused", "POST", "/api/attendance/check-out", 409, emp)
    expect("Attendance", "Own attendance history", "GET", "/api/attendance", 200, emp)

    # Password change (and restore so the demo account keeps working)
    expect("Employee", "Wrong current password is rejected", "POST", "/api/auth/change-password", 400, emp,
           {"currentPassword": "Nope1234", "newPassword": "Rotated123"})
    expect("Employee", "Change own password", "POST", "/api/auth/change-password", 204, emp,
           {"currentPassword": EMPLOYEE[1], "newPassword": "Rotated123"})
    expect("Employee", "Sign in with the new password", "POST", "/api/auth/login", 200,
           body={"email": EMPLOYEE[0], "password": "Rotated123"})
    restored = call("POST", "/api/auth/change-password", emp, {"currentPassword": "Rotated123", "newPassword": EMPLOYEE[1]})[0]
    check("Employee", "Restore the demo password", restored == 204)

    return report()


def report():
    width = max(len(name) for _, name, _, _ in results)
    area = None
    for section, name, ok, detail in results:
        if section != area:
            area = section
            print(f"\n{section}")
        print(f"  {'PASS' if ok else 'FAIL'}  {name.ljust(width)}  {'' if ok else detail}")
    failed = sum(1 for *_, ok, _ in results if not ok)
    print(f"\n{len(results) - failed}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
