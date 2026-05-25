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
import { eq, and } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async register(data: any) {
    const { email, password, fullName, role, companyName, companyCode } = data;

    // Check if user exists
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException('Email already exists');
    }

    let tenantId: string | null = null;
    let finalRole = role || 'intern';

    if (companyName) {
      // Path A: Register New Enterprise
      let code = this.generateInviteCode();
      let isUnique = false;
      while (!isUnique) {
        const [existing] = await this.db
          .select()
          .from(schema.tenants)
          .where(eq(schema.tenants.tenantCode, code))
          .limit(1);
        if (existing) {
          code = this.generateInviteCode();
        } else {
          isUnique = true;
        }
      }

      const [newTenant] = await this.db
        .insert(schema.tenants)
        .values({
          name: companyName,
          tenantCode: code,
        })
        .returning();

      tenantId = newTenant.id;
      finalRole = 'admin'; // Founder becomes admin
    } else if (companyCode) {
      // Path B: Join Existing Workspace
      const [existingTenant] = await this.db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.tenantCode, companyCode))
        .limit(1);
      if (!existingTenant) {
        throw new BadRequestException('Invalid enterprise invite code');
      }
      tenantId = existingTenant.id;

      // Enforce maximum of 2 admin accounts per workspace
      if (finalRole === 'admin') {
        const adminCount = await this.getAdminCount(tenantId!);
        if (adminCount >= 2) {
          throw new BadRequestException(
            'Maximum of 2 admin accounts has been reached for this workspace',
          );
        }
      }
    } else {
      throw new BadRequestException(
        'Either companyName or companyCode must be provided',
      );
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
        role: finalRole,
        tenantId,
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

    if (!user || !user.password) {
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
      tenantId: user.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
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

  async getAdminCount(tenantId: string) {
    const admins = await this.db
      .select()
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.tenantId, tenantId)));
    return admins.length;
  }
}
