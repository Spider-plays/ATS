import { db } from "./db";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";
import {
  User, InsertUser, users,
  Requirement, InsertRequirement, requirements,
  Stage, InsertStage, stages,
  RequirementRecruiter, InsertRequirementRecruiter, requirementRecruiters,
  Candidate, InsertCandidate, candidates,
  StageHistory, InsertStageHistory, stageHistory,
  Interview, InsertInterview, interviews,
  Feedback, InsertFeedback, feedback,
  Comment, InsertComment, comments
} from "@shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Type as any to avoid SessionStore type errors

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Insert the data directly without trying to extract an ID
    // since insertUserSchema already excludes the id field
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    const result = await db.delete(users).where(eq(users.id, id));
    if (!result) {
      throw new Error("User not found");
    }
  }
  
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Requirement methods
  async getRequirement(id: number): Promise<Requirement | undefined> {
    const [requirement] = await db.select().from(requirements).where(eq(requirements.id, id));
    return requirement;
  }

  async getRequirements(): Promise<Requirement[]> {
    return db.select().from(requirements);
  }

  async createRequirement(insertRequirement: InsertRequirement): Promise<Requirement> {
    // Remove id to allow auto-generation
    const { id, ...data } = insertRequirement as any;
    const [requirement] = await db.insert(requirements).values(data).returning();
    return requirement;
  }

  async updateRequirementStatus(id: number, status: string): Promise<Requirement | undefined> {
    const [updatedRequirement] = await db
      .update(requirements)
      .set({ status: status as any })
      .where(eq(requirements.id, id))
      .returning();
    
    return updatedRequirement;
  }

  // Stage methods
  async getStage(id: number): Promise<Stage | undefined> {
    const [stage] = await db.select().from(stages).where(eq(stages.id, id));
    return stage;
  }

  async getStages(): Promise<Stage[]> {
    return db.select().from(stages).orderBy(stages.order);
  }

  async createStage(insertStage: InsertStage): Promise<Stage> {
    // Remove id to allow auto-generation
    const { id, ...data } = insertStage as any;
    const [stage] = await db.insert(stages).values(data).returning();
    return stage;
  }

  // Candidate methods
  async getCandidate(id: number): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate;
  }

  async getCandidates(): Promise<Candidate[]> {
    return db.select().from(candidates);
  }

  async getCandidatesByRequirement(requirementId: number): Promise<Candidate[]> {
    return db.select().from(candidates).where(eq(candidates.requirementId, requirementId));
  }

  async getCandidatesByStage(stageId: number): Promise<Candidate[]> {
    return db.select().from(candidates).where(eq(candidates.currentStageId, stageId));
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    // Remove id to allow auto-generation
    const { id, ...data } = insertCandidate as any;
    const [candidate] = await db.insert(candidates).values(data).returning();
    return candidate;
  }

  async updateCandidateStage(id: number, stageId: number, userId: number, comments?: string): Promise<Candidate | undefined> {
    // First get the candidate to see the current stage
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    
    if (!candidate) {
      return undefined;
    }
    
    const previousStageId = candidate.currentStageId;
    
    // Update the candidate's stage
    const [updatedCandidate] = await db
      .update(candidates)
      .set({ currentStageId: stageId })
      .where(eq(candidates.id, id))
      .returning();
    
    // Create stage history
    await this.createStageHistory({
      candidateId: id,
      fromStageId: previousStageId,
      toStageId: stageId,
      movedBy: userId,
      comments: comments || null
    });
    
    return updatedCandidate;
  }

  // Stage History methods
  async getStageHistory(candidateId: number): Promise<StageHistory[]> {
    const history = await db
      .select()
      .from(stageHistory)
      .where(eq(stageHistory.candidateId, candidateId))
      .orderBy(stageHistory.movedAt);
    
    // Sort by moved date, most recent first
    return history.sort((a, b) => {
      return new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime();
    });
  }

  async createStageHistory(insertHistory: InsertStageHistory): Promise<StageHistory> {
    // Remove id to allow auto-generation
    const { id, ...data } = insertHistory as any;
    const [history] = await db.insert(stageHistory).values(data).returning();
    return history;
  }

  // Interview methods
  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async getInterviews(): Promise<Interview[]> {
    return db.select().from(interviews);
  }

  async getUpcomingInterviews(): Promise<Interview[]> {
    const now = new Date();
    
    const upcomingInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.status, "scheduled"));
    
    // Filter and sort in JavaScript since date comparison is easier here
    return upcomingInterviews
      .filter(interview => new Date(interview.scheduledTime) > now)
      .sort((a, b) => {
        return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      });
  }

  async getInterviewsByCandidate(candidateId: number): Promise<Interview[]> {
    return db.select().from(interviews).where(eq(interviews.candidateId, candidateId));
  }

  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    // Remove id to allow auto-generation
    const { id, ...data } = insertInterview as any;
    const [interview] = await db.insert(interviews).values(data).returning();
    return interview;
  }

  async updateInterviewStatus(id: number, status: string): Promise<Interview | undefined> {
    const [updatedInterview] = await db
      .update(interviews)
      .set({ status: status as any })
      .where(eq(interviews.id, id))
      .returning();
    
    return updatedInterview;
  }

  // Feedback methods
  async getFeedback(id: number): Promise<Feedback | undefined> {
    const [feedbackItem] = await db.select().from(feedback).where(eq(feedback.id, id));
    return feedbackItem;
  }

  async getFeedbackByInterview(interviewId: number): Promise<Feedback[]> {
    return db.select().from(feedback).where(eq(feedback.interviewId, interviewId));
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    // Remove id to allow auto-generation
    const { id, ...data } = insertFeedback as any;
    const [feedbackItem] = await db.insert(feedback).values(data).returning();
    return feedbackItem;
  }

  // Comment methods
  async getCommentsByCandidate(candidateId: number): Promise<Comment[]> {
    const candidateComments = await db
      .select()
      .from(comments)
      .where(eq(comments.candidateId, candidateId));
    
    // Sort by created date, most recent first
    return candidateComments.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    // Remove id to allow auto-generation
    const { id, ...data } = insertComment as any;
    const [comment] = await db.insert(comments).values(data).returning();
    return comment;
  }

  // Requirement-Recruiter methods
  async createRequirementRecruiter(data: InsertRequirementRecruiter): Promise<RequirementRecruiter> {
    const { id, ...insertData } = data as any;
    const [assignment] = await db.insert(requirementRecruiters)
      .values(insertData)
      .returning();
    return assignment;
  }

  async deleteRequirementRecruiter(requirementId: number, recruiterId: number): Promise<void> {
    await db.delete(requirementRecruiters)
      .where(eq(requirementRecruiters.requirementId, requirementId))
      .where(eq(requirementRecruiters.recruiterId, recruiterId));
  }

  // Get recruiters assigned to a requirement
  async getRequirementRecruiters(requirementId: number): Promise<User[]> {
    const assignments = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        role: users.role
      })
      .from(requirementRecruiters)
      .innerJoin(users, eq(requirementRecruiters.recruiterId, users.id))
      .where(eq(requirementRecruiters.requirementId, requirementId));
      
    return assignments;
  }
}

// Create and export an instance of the storage class
export const storage = new DatabaseStorage();