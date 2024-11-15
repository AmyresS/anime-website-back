'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE anime ALTER COLUMN "createdAt" SET DEFAULT NOW();
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE media_files ALTER COLUMN "createdAt" SET DEFAULT NOW();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE anime ALTER COLUMN "createdAt" DROP DEFAULT;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE media_files ALTER COLUMN "createdAt" DROP DEFAULT;
    `);
  }
};
