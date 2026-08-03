import jwt from "jsonwebtoken";

export const tokenGenerator = (secret, payload, time) => {
  const token = jwt.sign(payload, secret, {
    expiresIn: time,
  });
  return token;
};
