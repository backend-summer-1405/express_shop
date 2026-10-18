// ==================== CREATE USER TYPES ====================

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

// ==================== UPDATE USER TYPES ====================

export interface UpdateUserInput {
  email?: string;
  password?: string;
  name?: string;
}

// ==================== JWT PAYLOAD TYPES ====================

export interface UserJwtPayload {
  id: string;
  email: string;
  role: string;
}
