const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizePhone,
  parseAge,
  normalizeGender,
} = require("../scripts/importStudents");

test("normalizes Egyptian parent phone numbers", () => {
  assert.equal(normalizePhone(1227199672), "01227199672");
  assert.equal(normalizePhone("01228 522 048"), "01228522048");
  assert.equal(normalizePhone("‭٠ ١٢٢ ٦٥٨٤٥٠١‬"), "01226584501");
  assert.equal(normalizePhone("+20 12 3456 7890"), "01234567890");
});

test("normalizes numeric and Arabic student ages", () => {
  assert.equal(parseAge(14), 14);
  assert.equal(parseAge("٧سنوات"), 7);
  assert.equal(parseAge("١٢ سنه"), 12);
  assert.equal(parseAge("عشر سنوات"), 10);
  assert.equal(parseAge("سبع سنوات"), 7);
});

test("normalizes Arabic gender values", () => {
  assert.equal(normalizeGender("ذكر"), "male");
  assert.equal(normalizeGender("أنثى"), "female");
});
