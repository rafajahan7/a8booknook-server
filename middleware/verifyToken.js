
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({
            msg: "Unauthorized!"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).send({
            msg: "Unauthorized!"
        });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);

        req.user = payload;

        next();

    } catch (error) {
        console.log("JWT verification failed:", error.message);

        return res.status(401).send({
            msg: "Invalid or expired token!"
        });
    }
};

export default verifyToken;
