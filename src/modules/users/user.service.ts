import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { userRepository } from './user.repository.js';

export const userService = {
  async getMe(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(
        404,
        ERROR_CODE.USER_NOT_FOUND,
        '사용자를 찾을 수 없습니다.'
      );
    }
    return user;
  },
};
