import * as userRepository from "../repositories/user.repository.js";

const getUserByEmail = async (email) => {
  try {
    return await userRepository.findByEmail(email);
  } catch (e) {
    console.error(e);
    throw new Error("Failed to get user details.");
  }
};

export { getUserByEmail };
