import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-db";
import { ZodError } from "zod";
import {
  insertUserSchema,
  insertRequirementSchema,
  insertStageSchema,
  insertCandidateSchema,
  insertStageHistorySchema,
  insertInterviewSchema,
  insertFeedbackSchema,
  insertCommentSchema,
} from "@shared/schema";
import session from "express-session";
import { fromZodError } from "zod-validation-error";

// Define session type
declare module "express-session" {
  interface SessionData {
    userId: number;
    role: string;
  }
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware to check if user has role access
const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.session.userId || !req.session.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "talent-viz-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // AUTH ROUTES
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.role = user.role;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);

      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // USER ROUTES
  app.get("/api/users", isAuthenticated, hasRole(["admin", "manager"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Filter out passwords
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      console.log("Raw request body:", req.body);
      const userData = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", userData);

      const existingUser = await storage.getUserByUsername(userData.username);

      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser(userData);

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only validate the fields we're updating
      const updateData = req.body;

      // Check if username is changed and if it already exists
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await storage.getUserByUsername(updateData.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      // Update the user
      const updatedUser = await storage.updateUser(id, updateData);

      // Return user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      // Prevent admins from deleting their own account
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(id);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // REQUIREMENT ROUTES
  app.get("/api/requirements", isAuthenticated, async (req, res) => {
    try {
      const requirements = await storage.getRequirements();
      res.status(200).json(requirements);
    } catch (error) {
      console.error("Get requirements error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/requirements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const requirement = await storage.getRequirement(id);

      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      res.status(200).json(requirement);
    } catch (error) {
      console.error("Get requirement error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/requirements", isAuthenticated, hasRole(["admin", "manager"]), async (req, res) => {
    try {
      const requirementData = insertRequirementSchema.parse(req.body);

      // Set current user as creator
      requirementData.createdBy = req.session.userId!;

      const newRequirement = await storage.createRequirement(requirementData);
      res.status(201).json(newRequirement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Create requirement error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/requirements/:id/status", isAuthenticated, hasRole(["admin", "manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const { status } = req.body;
      if (!status || !["draft", "pending", "approved", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedRequirement = await storage.updateRequirementStatus(id, status);

      if (!updatedRequirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      res.status(200).json(updatedRequirement);
    } catch (error) {
      console.error("Update requirement status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // REQUIREMENT-RECRUITER ROUTES
  app.post("/api/requirements/:id/recruiters", isAuthenticated, hasRole(["admin", "manager"]), async (req, res) => {
    try {
      const requirementId = parseInt(req.params.id);
      const { recruiterId } = req.body;

      if (isNaN(requirementId) || !recruiterId) {
        return res.status(400).json({ message: "Invalid requirement ID or recruiter ID" });
      }

      // Check if recruiter is already assigned
      const assignedRecruiters = await storage.getRequirementRecruiters(requirementId);
      if (assignedRecruiters.some(r => r.id === recruiterId)) {
        return res.status(400).json({ message: "Recruiter is already assigned to this requirement" });
      }

      const assignment = await storage.createRequirementRecruiter({
        requirementId,
        recruiterId,
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Assign recruiter error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/requirements/:id/recruiters/:recruiterId", isAuthenticated, hasRole(["admin", "manager"]), async (req, res) => {
    try {
      const requirementId = parseInt(req.params.id);
      const recruiterId = parseInt(req.params.recruiterId);

      if (isNaN(requirementId) || isNaN(recruiterId)) {
        return res.status(400).json({ message: "Invalid requirement ID or recruiter ID" });
      }

      await storage.deleteRequirementRecruiter(requirementId, recruiterId);
      res.status(200).json({ message: "Recruiter unassigned successfully" });
    } catch (error) {
      console.error("Remove recruiter error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // STAGE ROUTES  
  app.get("/api/stages", isAuthenticated, async (req, res) => {
    try {
      const stages = await storage.getStages();
      res.status(200).json(stages);
    } catch (error) {
      console.error("Get stages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/stages", isAuthenticated, hasRole(["admin", "manager"]), async (req, res) => {
    try {
      const stageData = insertStageSchema.parse(req.body);
      const newStage = await storage.createStage(stageData);
      res.status(201).json(newStage);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Create stage error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // CANDIDATE ROUTES
  app.get("/api/candidates", isAuthenticated, async (req, res) => {
    try {
      let candidates;

      // Filter by requirement or stage if specified
      if (req.query.requirementId) {
        const requirementId = parseInt(req.query.requirementId as string);
        if (isNaN(requirementId)) {
          return res.status(400).json({ message: "Invalid requirement ID" });
        }
        candidates = await storage.getCandidatesByRequirement(requirementId);
      } else if (req.query.stageId) {
        const stageId = parseInt(req.query.stageId as string);
        if (isNaN(stageId)) {
          return res.status(400).json({ message: "Invalid stage ID" });
        }
        candidates = await storage.getCandidatesByStage(stageId);
      } else {
        candidates = await storage.getCandidates();
      }

      res.status(200).json(candidates);
    } catch (error) {
      console.error("Get candidates error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/candidates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const candidate = await storage.getCandidate(id);

      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      res.status(200).json(candidate);
    } catch (error) {
      console.error("Get candidate error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/candidates", isAuthenticated, async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);

      // Validate if requirement and stage exist
      const requirement = await storage.getRequirement(candidateData.requirementId);
      const stage = await storage.getStage(candidateData.currentStageId);

      if (!requirement) {
        return res.status(400).json({ message: "Invalid requirement ID" });
      }

      if (!stage) {
        return res.status(400).json({ message: "Invalid stage ID" });
      }

      const newCandidate = await storage.createCandidate(candidateData);

      // Create initial stage history
      await storage.createStageHistory({
        candidateId: newCandidate.id,
        fromStageId: null,
        toStageId: candidateData.currentStageId,
        movedBy: req.session.userId!,
        comments: "Initial application"
      });

      res.status(201).json(newCandidate);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Create candidate error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/candidates/:id/stage", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const { stageId, comments } = req.body;
      if (!stageId || isNaN(parseInt(stageId))) {
        return res.status(400).json({ message: "Invalid stage ID" });
      }

      // Validate if stage exists
      const stage = await storage.getStage(parseInt(stageId));
      if (!stage) {
        return res.status(400).json({ message: "Stage not found" });
      }

      const updatedCandidate = await storage.updateCandidateStage(
        id, 
        parseInt(stageId), 
        req.session.userId!,
        comments
      );

      if (!updatedCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      res.status(200).json(updatedCandidate);
    } catch (error) {
      console.error("Update candidate stage error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // STAGE HISTORY ROUTES
  app.get("/api/candidates/:id/history", isAuthenticated, async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      if (isNaN(candidateId)) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }

      const history = await storage.getStageHistory(candidateId);
      res.status(200).json(history);
    } catch (error) {
      console.error("Get stage history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // INTERVIEW ROUTES
  app.get("/api/interviews", isAuthenticated, async (req, res) => {
    try {
      let interviews;

      if (req.query.upcoming === "true") {
        interviews = await storage.getUpcomingInterviews();
      } else if (req.query.candidateId) {
        const candidateId = parseInt(req.query.candidateId as string);
        if (isNaN(candidateId)) {
          return res.status(400).json({ message: "Invalid candidate ID" });
        }
        interviews = await storage.getInterviewsByCandidate(candidateId);
      } else {
        interviews = await storage.getInterviews();
      }

      res.status(200).json(interviews);
    } catch (error) {
      console.error("Get interviews error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/interviews", isAuthenticated, async (req, res) => {
    try {
      const interviewData = insertInterviewSchema.parse(req.body);

      // Validate candidate and requirement
      const candidate = await storage.getCandidate(interviewData.candidateId);
      const requirement = await storage.getRequirement(interviewData.requirementId);

      if (!candidate) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }

      if (!requirement) {
        return res.status(400).json({ message: "Invalid requirement ID" });
      }

      const newInterview = await storage.createInterview(interviewData);
      res.status(201).json(newInterview);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Create interview error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/interviews/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const { status } = req.body;
      if (!status || !["scheduled", "completed", "canceled", "no-show"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedInterview = await storage.updateInterviewStatus(id, status);

      if (!updatedInterview) {
        return res.status(404).json({ message: "Interview not found" });
      }

      res.status(200).json(updatedInterview);
    } catch (error) {
      console.error("Update interview status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // FEEDBACK ROUTES
  app.get("/api/interviews/:id/feedback", isAuthenticated, async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      if (isNaN(interviewId)) {
        return res.status(400).json({ message: "Invalid interview ID" });
      }

      const feedback = await storage.getFeedbackByInterview(interviewId);
      res.status(200).json(feedback);
    } catch (error) {
      console.error("Get feedback error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse(req.body);

      // Set current user as provider
      feedbackData.providedBy = req.session.userId!;

      // Validate interview
      const interview = await storage.getInterview(feedbackData.interviewId);

      if (!interview) {
        return res.status(400).json({ message: "Invalid interview ID" });
      }

      const newFeedback = await storage.createFeedback(feedbackData);
      res.status(201).json(newFeedback);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Create feedback error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // COMMENT ROUTES
  app.get("/api/candidates/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      if (isNaN(candidateId)) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }

      const comments = await storage.getCommentsByCandidate(candidateId);
      res.status(200).json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);

      // Set current user as commenter
      commentData.userId = req.session.userId!;

      // Validate candidate
      const candidate = await storage.getCandidate(commentData.candidateId);

      if (!candidate) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }

      const newComment = await storage.createComment(commentData);
      res.status(201).json(newComment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Create comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DASHBOARD STATS
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      const requirements = await storage.getRequirements();
      const stages = await storage.getStages();
      const interviews = await storage.getInterviews();

      // Count candidates by stage
      const candidatesByStage = stages.map(stage => {
        const count = candidates.filter(c => c.currentStageId === stage.id).length;
        return {
          stageId: stage.id,
          stageName: stage.name,
          count
        };
      });

      // Count active, hired and rejected candidates
      const activeCandidates = candidates.filter(c => c.status === "active").length;
      const hiredCandidates = candidates.filter(c => c.status === "hired").length;
      const rejectedCandidates = candidates.filter(c => c.status === "rejected").length;

      // Count open and urgent requirements
      const openRequirements = requirements.filter(r => r.status === "approved").length;
      const urgentRequirements = requirements.filter(r => r.status === "approved" && r.priority === "urgent").length;

      // Get upcoming interviews
      const upcomingInterviews = await storage.getUpcomingInterviews();
      const todayInterviews = upcomingInterviews.filter(i => {
        const today = new Date();
        const interviewDate = new Date(i.scheduledTime);
        return (
          interviewDate.getDate() === today.getDate() &&
          interviewDate.getMonth() === today.getMonth() &&
          interviewDate.getFullYear() === today.getFullYear()
        );
      }).length;

      res.status(200).json({
        candidates: {
          total: candidates.length,
          active: activeCandidates,
          hired: hiredCandidates,
          rejected: rejectedCandidates,
          byStage: candidatesByStage
        },
        requirements: {
          total: requirements.length,
          open: openRequirements,
          urgent: urgentRequirements
        },
        interviews: {
          total: interviews.length,
          upcoming: upcomingInterviews.length,
          today: todayInterviews
        }
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}