const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ApiError = require('../errorHandler/ApiError');
const User = require('../models/user');

const { PRIVATE_KEY } = process.env;

// REGISTRATION//
const registration = (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw ApiError.userError('you need to fill in data');
  }
  User.findOne({ email })
    .then((regUser) => {
      if (regUser) {
        throw ApiError.userExistError('user allready exist');
      }
      return bcrypt.hash(password, 10).then((hash) => {
        User.create({
          email,
          password: hash,
          name,
        }).then((user) => res.status(200).send({ email: user.email, name: user.name }));
      });
    })
    .catch(next);
};

// LOGIN IN//
const login = (req, res, next) => {
  const { email, password } = req.body;

  if ((!email, !password)) {
    throw ApiError.userError('enter email and password');
  }
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        throw ApiError.userError('invalid email or password');
      }
      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          throw ApiError.userError('invalid email or password');
        }
        const token = jwt.sign({ id: user._id }, `${PRIVATE_KEY}`, {
          expiresIn: '7d',
        });
        return res.status(200).send({ token });
      });
    })
    .catch(next);
};

// GET USER
const getUser = (req, res, next) => {
  const userId = req.user.id;

  User.findById(userId)
    .then((user) => res.status(200).send({ email: user.email, name: user.name }))
    .catch(next);
};

// UPDATE USER INFO
const updateUser = (req, res, next) => {
  const { email, name } = req.body;
  const userId = req.user.id;

  User.findByIdAndUpdate(
    userId,
    { email, name },
    { new: true, runValidators: true },
  )
    .then((user) => {
      if (user) {
        return res.status(200).send({ email: user.email, name: user.name });
      }
      throw ApiError.notFoundError('data is incorrect');
    })
    .catch(next);
};

module.exports = {
  getUser,
  updateUser,
  registration,
  login,
};