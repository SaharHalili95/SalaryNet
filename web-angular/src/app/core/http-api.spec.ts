import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpSalaryNetApi } from './http-api';

describe('HttpSalaryNetApi', () => {
  let api: HttpSalaryNetApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(HttpSalaryNetApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('drops empty query values like the shared fetch client', async () => {
    const result = api.employees.search({ search: 'Noa', departmentId: undefined, page: 1 });
    const req = http.expectOne((r) => r.url === '/api/employees');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual(['search', 'page']);
    expect(req.request.params.get('search')).toBe('Noa');
    req.flush({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });
    expect((await result).totalCount).toBe(0);
  });

  it('posts credentials to sign in', async () => {
    const result = api.login('hr@salarynet.demo', 'Demo123!');
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'hr@salarynet.demo', password: 'Demo123!' });
    req.flush({ accessToken: 't', expiresAt: '2030-01-01T00:00:00Z', user: {} });
    expect((await result).accessToken).toBe('t');
  });

  it('maps an empty current shift to null', async () => {
    const result = api.attendance.current();
    http.expectOne('/api/attendance/current').flush(null, { status: 204, statusText: 'No Content' });
    expect(await result).toBeNull();
  });

  it('uses PUT for updates and the activate/deactivate endpoints', () => {
    void api.employees.update('e1', {} as never);
    void api.employees.setActive('e1', false);
    expect(http.expectOne('/api/employees/e1').request.method).toBe('PUT');
    expect(http.expectOne('/api/employees/e1/deactivate').request.method).toBe('POST');
  });
});
