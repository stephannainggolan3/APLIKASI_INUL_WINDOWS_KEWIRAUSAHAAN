// Netlify Function: menjalankan server Express BoysClub IT untuk semua request /api/*
const serverless = require('serverless-http');
const app = require('../../server');

module.exports.handler = serverless(app);
