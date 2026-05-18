import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: any) {
    const { email, password, fullName, role } = data;

    // Check if user exists
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('Email already exists');
    }

    // Enforce maximum of 2 admin accounts
    if (role === 'admin') {
      const adminCount = await this.getAdminCount();
      if (adminCount >= 2) {
        throw new BadRequestException('Maximum of 2 admin accounts has been reached');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await this.db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        fullName,
        role: role || 'intern',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return this.generateToken(user);
  }

  async login(data: any) {
    const { email, password } = data;

    // Find user
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async validateUser(payload: any) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    return user || null;
  }

  async getAllUsers() {
    return this.db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
      })
      .from(users);
  }

  async getAdminCount() {
    const admins = await this.db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));
    return admins.length;
  }
}
