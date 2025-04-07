import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { HomePage } from './home.page';
import { DatabaseService } from '../services/database.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let mockDatabaseService: jasmine.SpyObj<DatabaseService>;
  
  // Mock user data
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com'
  };
  
  // Create a mock for the DatabaseService
  beforeEach(() => {
    const dbServiceSpy = jasmine.createSpyObj('DatabaseService', 
      ['isAuthenticated', 'logout']);
    
    // Configure the mock behavior
    dbServiceSpy.isAuthenticated.and.returnValue(true);
    // Criando uma propriedade currentUser$ simulada para o mock
    (dbServiceSpy as any).currentUser$ = new BehaviorSubject(mockUser);
    
    mockDatabaseService = dbServiceSpy;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HomePage
      ],
      providers: [
        { provide: DatabaseService, useValue: mockDatabaseService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should initialize with authenticated user data', () => {
    component.ngOnInit();
    expect(component.isAuthenticated).toBeTrue();
    expect(component.userName).toBe('Test User');
  });
  
  it('should call logout when logout method is called', () => {
    component.logout();
    expect(mockDatabaseService.logout).toHaveBeenCalledWith(); // Corrigido para usar toHaveBeenCalledWith() vazio
    expect(component.isAuthenticated).toBeFalse();
    expect(component.userName).toBe('');
  });
  
  it('should update auth status when ionViewWillEnter is called', () => {
    mockDatabaseService.isAuthenticated.and.returnValue(false);
    component.ionViewWillEnter();
    expect(component.isAuthenticated).toBeFalse();
  });
});
