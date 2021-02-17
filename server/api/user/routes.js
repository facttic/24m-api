const { UserController } = require("./controller");
const auth = require("../middleware/auth");
const { shapeQuery } = require("../middleware/shape-query");
const { UserDAO } = require("mv-models");

class UserRoutes {
  static init(router) {
    const userController = new UserController();
    router.route("/users/").post(auth, userController.create);
    router.route("/users/").get(shapeQuery(UserDAO.schema), auth, userController.getAll);
    router.route("/users/:userId").get(auth, userController.getOne);
    router.route("/users/:userId").delete(auth, userController.delete);
    router.route("/users/:userId").put(auth, userController.update);
    router.route("/users/login").post(userController.logIn);
    router.route("/users/me").post(auth, userController.userProfile);
    router.route("/users/me/logout").post(auth, userController.logOut);
    router.route("/users/me/logoutall").post(auth, userController.logOutAll);
  }
}

module.exports = { UserRoutes };
