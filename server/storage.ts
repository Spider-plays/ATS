import { 
  User, InsertUser, users,
  Requirement, InsertRequirement, requirements,
  Stage, InsertStage, stages,
  Candidate, InsertCandidate, candidates,
  StageHistory, InsertStageHistory, stageHistory,
  Interview, InsertInterview, interviews,
  Feedback, InsertFeedback, feedback,
  Comment, InsertComment, comments
} from "@shared/schema";

export interface IStorage {
  // Requirement-Recruiter
  createRequirementRecruiter(data: InsertRequirementRecruiter): Promise<RequirementRecruiter>;
  deleteRequirementRecruiter(requirementId: number, recruiterId: number): Promise<void>;
  getRequirementRecruiters(requirementId: number): Promise<User[]>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getUsers(): Promise<User[]>;
  
  // Requirements
  getRequirement(id: number): Promise<Requirement | undefined>;
  getRequirements(): Promise<Requirement[]>;
  createRequirement(requirement: InsertRequirement): Promise<Requirement>;
  updateRequirementStatus(id: number, status: string): Promise<Requirement | undefined>;
  
  // Stages
  getStage(id: number): Promise<Stage | undefined>;
  getStages(): Promise<Stage[]>;
  createStage(stage: InsertStage): Promise<Stage>;
  
  // Candidates
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidates(): Promise<Candidate[]>;
  getCandidatesByRequirement(requirementId: number): Promise<Candidate[]>;
  getCandidatesByStage(stageId: number): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidateStage(id: number, stageId: number, userId: number, comments?: string): Promise<Candidate | undefined>;
  
  // Stage History
  getStageHistory(candidateId: number): Promise<StageHistory[]>;
  createStageHistory(history: InsertStageHistory): Promise<StageHistory>;
  
  // Interviews
  getInterview(id: number): Promise<Interview | undefined>;
  getInterviews(): Promise<Interview[]>;
  getUpcomingInterviews(): Promise<Interview[]>;
  getInterviewsByCandidate(candidateId: number): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterviewStatus(id: number, status: string): Promise<Interview | undefined>;
  
  // Feedback
  getFeedback(id: number): Promise<Feedback | undefined>;
  getFeedbackByInterview(interviewId: number): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  // Comments
  getCommentsByCandidate(candidateId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private requirements: Map<number, Requirement>;
  private stages: Map<number, Stage>;
  private candidates: Map<number, Candidate>;
  private stageHistories: Map<number, StageHistory>;
  private interviews: Map<number, Interview>;
  private feedbacks: Map<number, Feedback>;
  private comments: Map<number, Comment>;
  
  private currentUserId: number;
  private currentRequirementId: number;
  private currentStageId: number;
  private currentCandidateId: number;
  private currentStageHistoryId: number;
  private currentInterviewId: number;
  private currentFeedbackId: number;
  private currentCommentId: number;

  constructor() {
    this.users = new Map();
    this.requirements = new Map();
    this.stages = new Map();
    this.candidates = new Map();
    this.stageHistories = new Map();
    this.interviews = new Map();
    this.feedbacks = new Map();
    this.comments = new Map();
    
    this.currentUserId = 1;
    this.currentRequirementId = 1;
    this.currentStageId = 1;
    this.currentCandidateId = 1;
    this.currentStageHistoryId = 1;
    this.currentInterviewId = 1;
    this.currentFeedbackId = 1;
    this.currentCommentId = 1;
    
    // Initialize with default data
    this.initDefaultData();
  }

  private initDefaultData() {
    // Create default stages
    const defaultStages = [
      { name: "Applied", order: 1, isDefault: true },
      { name: "Screening", order: 2, isDefault: false },
      { name: "Interview", order: 3, isDefault: false },
      { name: "Offer", order: 4, isDefault: false },
      { name: "Hired", order: 5, isDefault: false },
      { name: "Rejected", order: 6, isDefault: false }
    ];
    
    defaultStages.forEach(stage => {
      this.createStage(stage);
    });
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      email: "admin@talentviz.com",
      role: "admin",
      avatar: "",
    });
    
    // Create manager user
    this.createUser({
      username: "manager",
      password: "manager123",
      fullName: "Alex Morgan",
      email: "alex@talentviz.com",
      role: "manager",
      avatar: "",
    });
    
    // Create recruiter user
    this.createUser({
      username: "recruiter",
      password: "recruiter123",
      fullName: "Robin Taylor",
      email: "robin@talentviz.com",
      role: "recruiter",
      avatar: "",
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error("User not found");
    }
    this.users.delete(id);
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Requirement methods
  async getRequirement(id: number): Promise<Requirement | undefined> {
    return this.requirements.get(id);
  }

  async getRequirements(): Promise<Requirement[]> {
    return Array.from(this.requirements.values());
  }

  async createRequirement(insertRequirement: InsertRequirement): Promise<Requirement> {
    const id = this.currentRequirementId++;
    const now = new Date();
    const requirement: Requirement = { ...insertRequirement, id, createdAt: now };
    this.requirements.set(id, requirement);
    return requirement;
  }

  async updateRequirementStatus(id: number, status: string): Promise<Requirement | undefined> {
    const requirement = this.requirements.get(id);
    if (!requirement) return undefined;
    
    const updatedRequirement: Requirement = { ...requirement, status: status as any };
    this.requirements.set(id, updatedRequirement);
    return updatedRequirement;
  }

  // Stage methods
  async getStage(id: number): Promise<Stage | undefined> {
    return this.stages.get(id);
  }

  async getStages(): Promise<Stage[]> {
    return Array.from(this.stages.values()).sort((a, b) => a.order - b.order);
  }

  async createStage(insertStage: InsertStage): Promise<Stage> {
    const id = this.currentStageId++;
    const stage: Stage = { ...insertStage, id };
    this.stages.set(id, stage);
    return stage;
  }

  // Candidate methods
  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async getCandidatesByRequirement(requirementId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(
      candidate => candidate.requirementId === requirementId
    );
  }

  async getCandidatesByStage(stageId: number): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(
      candidate => candidate.currentStageId === stageId
    );
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentCandidateId++;
    const now = new Date();
    const candidate: Candidate = { ...insertCandidate, id, createdAt: now };
    this.candidates.set(id, candidate);
    return candidate;
  }

  async updateCandidateStage(id: number, stageId: number, userId: number, comments?: string): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) return undefined;
    
    const previousStageId = candidate.currentStageId;
    const updatedCandidate: Candidate = { ...candidate, currentStageId: stageId };
    this.candidates.set(id, updatedCandidate);
    
    // Create stage history
    await this.createStageHistory({
      candidateId: id,
      fromStageId: previousStageId,
      toStageId: stageId,
      movedBy: userId,
      comments
    });
    
    return updatedCandidate;
  }

  // Stage History methods
  async getStageHistory(candidateId: number): Promise<StageHistory[]> {
    return Array.from(this.stageHistories.values())
      .filter(history => history.candidateId === candidateId)
      .sort((a, b) => b.movedAt.getTime() - a.movedAt.getTime());
  }

  async createStageHistory(insertHistory: InsertStageHistory): Promise<StageHistory> {
    const id = this.currentStageHistoryId++;
    const now = new Date();
    const history: StageHistory = { ...insertHistory, id, movedAt: now };
    this.stageHistories.set(id, history);
    return history;
  }

  // Interview methods
  async getInterview(id: number): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }

  async getInterviews(): Promise<Interview[]> {
    return Array.from(this.interviews.values());
  }

  async getUpcomingInterviews(): Promise<Interview[]> {
    const now = new Date();
    return Array.from(this.interviews.values())
      .filter(interview => 
        interview.scheduledTime > now && 
        interview.status === "scheduled"
      )
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  async getInterviewsByCandidate(candidateId: number): Promise<Interview[]> {
    return Array.from(this.interviews.values())
      .filter(interview => interview.candidateId === candidateId);
  }

  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const id = this.currentInterviewId++;
    const interview: Interview = { ...insertInterview, id };
    this.interviews.set(id, interview);
    return interview;
  }

  async updateInterviewStatus(id: number, status: string): Promise<Interview | undefined> {
    const interview = this.interviews.get(id);
    if (!interview) return undefined;
    
    const updatedInterview: Interview = { ...interview, status: status as any };
    this.interviews.set(id, updatedInterview);
    return updatedInterview;
  }

  // Feedback methods
  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async getFeedbackByInterview(interviewId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.interviewId === interviewId);
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentFeedbackId++;
    const now = new Date();
    const feedback: Feedback = { ...insertFeedback, id, submittedAt: now };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  // Comment methods
  async getCommentsByCandidate(candidateId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.candidateId === candidateId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const now = new Date();
    const comment: Comment = { ...insertComment, id, createdAt: now };
    this.comments.set(id, comment);
    return comment;
  }

  // Requirement-Recruiter methods
  private requirementRecruiters = new Map<number, RequirementRecruiter>();
  private currentRequirementRecruiterId = 1;

  async createRequirementRecruiter(data: InsertRequirementRecruiter): Promise<RequirementRecruiter> {
    const id = this.currentRequirementRecruiterId++;
    const assignment: RequirementRecruiter = { ...data, id };
    this.requirementRecruiters.set(id, assignment);
    return assignment;
  }

  async deleteRequirementRecruiter(requirementId: number, recruiterId: number): Promise<void> {
    const assignment = Array.from(this.requirementRecruiters.values()).find(
      a => a.requirementId === requirementId && a.recruiterId === recruiterId
    );
    if (assignment) {
      this.requirementRecruiters.delete(assignment.id);
    }
  }
}

export const storage = new MemStorage();
