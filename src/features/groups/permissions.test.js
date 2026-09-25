import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasGroupAccess,
  canPerformAction,
  isPlatformAdmin,
} from "./permissions.js";
import { GROUP_ACTIONS, PRIVACY } from "./types.js";

const memberUser = { email: "m@test.com", role: "user" };
const adminUser = { email: "a@test.com", role: "admin" };
const publicGroup = { id: "g1", privacy: PRIVACY.PUBLIC, createdBy: "c@test.com" };
const privateGroup = { id: "g2", privacy: PRIVACY.PRIVATE, createdBy: "c@test.com" };
const activeMember = {
  groupId: "g2",
  userEmail: "m@test.com",
  role: "GROUP_MEMBER",
  status: "active",
};
const activeGroupAdmin = {
  groupId: "g2",
  userEmail: "m@test.com",
  role: "GROUP_ADMIN",
  status: "active",
};

describe("isPlatformAdmin", () => {
  it("detects role admin and isAdmin flag", () => {
    assert.equal(isPlatformAdmin({ role: "admin" }), true);
    assert.equal(isPlatformAdmin({ isAdmin: true }), true);
    assert.equal(isPlatformAdmin({ role: "user" }), false);
    assert.equal(isPlatformAdmin(null), false);
  });
});

describe("hasGroupAccess", () => {
  it("allows anyone signed-relevant for PUBLIC content when member or public join context", () => {
    assert.equal(hasGroupAccess(memberUser, publicGroup, activeMember), true);
  });

  it("denies non-member on PRIVATE", () => {
    assert.equal(hasGroupAccess(memberUser, privateGroup, null), false);
  });

  it("allows active member on PRIVATE", () => {
    assert.equal(hasGroupAccess(memberUser, privateGroup, activeMember), true);
  });

  it("allows platform admin on PRIVATE without membership", () => {
    assert.equal(hasGroupAccess(adminUser, privateGroup, null), true);
  });
});

describe("canPerformAction", () => {
  it("blocks post for non-member on private", () => {
    assert.equal(
      canPerformAction(memberUser, privateGroup, null, GROUP_ACTIONS.POST_MESSAGE),
      false,
    );
  });

  it("allows post for active member", () => {
    assert.equal(
      canPerformAction(memberUser, privateGroup, activeMember, GROUP_ACTIONS.POST_MESSAGE),
      true,
    );
  });

  it("allows settings only for group admin or platform admin", () => {
    assert.equal(
      canPerformAction(memberUser, privateGroup, activeMember, GROUP_ACTIONS.UPDATE_SETTINGS),
      false,
    );
    assert.equal(
      canPerformAction(memberUser, privateGroup, activeGroupAdmin, GROUP_ACTIONS.UPDATE_SETTINGS),
      true,
    );
    assert.equal(
      canPerformAction(adminUser, privateGroup, null, GROUP_ACTIONS.UPDATE_SETTINGS),
      true,
    );
  });

  it("allows platform admin to post without membership", () => {
    assert.equal(
      canPerformAction(adminUser, privateGroup, null, GROUP_ACTIONS.POST_MESSAGE),
      true,
    );
  });
});
