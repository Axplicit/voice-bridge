import { Router } from "express";
import { signIn, signUp, updatePreferences, searchUser, voiceSetup, forgotPassword, resetPassword, changePassword } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.route("/signup").post(signUp);
authRouter.route("/signin").post(signIn);
authRouter.route("/forgot-password").post(forgotPassword);
authRouter.route("/reset-password").post(resetPassword);
authRouter.route("/change-password").post(changePassword);



authRouter.route("/preferences").patch(updatePreferences);


authRouter.route("/voice-setup").post(voiceSetup);


authRouter.route("/users/search").get(searchUser);

export default authRouter;