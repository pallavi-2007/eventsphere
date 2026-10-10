import { loginUser, registerUser, getUserById, updateUserName } from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await registerUser({ name, email, password, role });
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;
    const updatedUser = await updateUserName(req.user.id, name);
    res.status(200).json({
      success: true,
      message: 'Profile name updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

