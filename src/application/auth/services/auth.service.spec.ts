jest.mock('@domain/models/user.model', () => {
  const actual = jest.requireActual('@domain/models/user.model');
  return {
    ...actual,
    User: {
      ...actual.User,
      create: jest.fn(),
    },
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserStore } from '@infrastructure/stores/user.store';
import { UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { User } from '@domain/models/user.model';

describe('AuthService (Hybrid Tests)', () => {
  let authService: AuthService;

  const mockUserStore = {
    findByEmail: jest.fn(),
    exists: jest.fn(),
    findByRefCode: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserStore, useValue: mockUserStore },
        { provide: JwtService, useValue: mockJwtService },
        Logger,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const dtoBase = {
      email: 'test@mail.com',
      password: 'pass',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user (no referral)', async () => {
      const mockUser = {
        ...dtoBase,
        generateGenesisRefBox: jest.fn(),
      };

      (User.create as jest.Mock).mockResolvedValue(mockUser);
      mockUserStore.exists.mockResolvedValue(false);
      mockUserStore.findByRefCode.mockResolvedValue(null);
      mockUserStore.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('token');

      const result = await authService.register(dtoBase);

      expect(User.create).toHaveBeenCalledWith(dtoBase.email, dtoBase.password, dtoBase.firstName, dtoBase.lastName);
      expect(mockUser.generateGenesisRefBox).toHaveBeenCalled();
      expect(mockUserStore.save).toHaveBeenCalledWith(mockUser);
      expect(result.accessToken).toBe('token');
    });

    it('should register a new user (with referral)', async () => {
      const dto = { ...dtoBase, referralCode: 'ref123' };

      const mockUser = {
        ...dto,
        generateRefBoxByReferredUser: jest.fn(),
      };

      const mockReferrer = {
        processReferral: jest.fn(),
      };

      (User.create as jest.Mock).mockResolvedValue(mockUser);
      mockUserStore.exists.mockResolvedValue(false);
      mockUserStore.findByRefCode.mockResolvedValue(mockReferrer);
      mockUserStore.save.mockResolvedValueOnce(mockReferrer).mockResolvedValueOnce(mockUser);
      mockJwtService.sign.mockReturnValue('token');

      const result = await authService.register(dto);

      expect(User.create).toHaveBeenCalled();
      expect(mockUser.generateRefBoxByReferredUser).toHaveBeenCalled();
      expect(mockReferrer.processReferral).toHaveBeenCalled();
      expect(mockUserStore.save).toHaveBeenNthCalledWith(1, mockReferrer);
      expect(mockUserStore.save).toHaveBeenNthCalledWith(2, mockUser);
      expect(result.accessToken).toBe('token');
    });

    it('should throw ConflictException if user exists', async () => {
      mockUserStore.exists.mockResolvedValue(true);

      await expect(authService.register(dtoBase)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    const email = 'test@mail.com';
    const password = 'pass';

    it('should validate user successfully', async () => {
      const mockUser = {
        email,
        validatePassword: jest.fn().mockResolvedValue(true),
        refCode: 'some-code',
      };

      mockUserStore.findByEmail.mockResolvedValue(mockUser);

      const result = await authService.validateUser(email, password);
      expect(result).toBe(mockUser);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(password);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserStore.findByEmail.mockResolvedValue(null);

      await expect(authService.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        email,
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      mockUserStore.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should create genesis refBox if refCode is missing', async () => {
      const mockUser = {
        email,
        validatePassword: jest.fn().mockResolvedValue(true),
        refCode: null,
        generateGenesisRefBox: jest.fn(),
      };

      mockUserStore.findByEmail.mockResolvedValue(mockUser);
      mockUserStore.save.mockResolvedValue(mockUser);

      const result = await authService.validateUser(email, password);

      expect(mockUser.generateGenesisRefBox).toHaveBeenCalled();
      expect(mockUserStore.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });
  });

  describe('login', () => {
    it('should login successfully and return AuthResponse', async () => {
      const dto = { email: 'test@mail.com', password: 'pass' };

      const mockUser = {
        id: 'user-id',
        email: dto.email,
        firstName: 'John',
        lastName: 'Doe',
        refCode: 'abc',
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      mockUserStore.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await authService.login(dto);

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.email).toBe(dto.email);
    });
  });
});
