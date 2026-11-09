import { test } from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../src/middlewares/errorHandler.js";

function fakeResponse() {
  return {
    statusCode: 0,
    body: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

function handle(err: unknown) {
  const res = fakeResponse();
  errorHandler(err, {} as any, res as any, () => {});
  return res;
}

test("violação de CHECK do banco informa o campo na mensagem", () => {
  const res = handle(new Error("CHECK constraint failed: role IN ('administrador','tecnico')"));
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.equal(res.body.error.message, 'Valor inválido para o campo "role".');
});

test("violação de CHECK sem nome de coluna usa a mensagem genérica", () => {
  const res = handle(new Error("CHECK constraint failed: (quantidade > 0)"));
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.message, "Um dos valores informados não é permitido.");
});
