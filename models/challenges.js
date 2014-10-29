/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
'use strict';

/**
 * Defining Challenge model.
 * It's the same with Challenge model used in serenity-core,
 * but it adds hasMany relationship with ChallengeRegistrant model,
 * and remove the other unneeded relationships.
 *
 * Added Requirement field with association.
 */
module.exports = function(sequelize, DataTypes) {

  var Challenge = sequelize.define('Challenge', {
    createdBy:  DataTypes.STRING(64),
    updatedBy:  DataTypes.STRING(64),
    regStartDate: DataTypes.DATE,
    subEndDate: DataTypes.DATE,
    title: {
      type: DataTypes.STRING(128),
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    status : DataTypes.STRING(32),
    type: DataTypes.STRING(32),
    overview: DataTypes.STRING(140),
    description: DataTypes.TEXT,
    registeredDescription: DataTypes.TEXT,
    tags: DataTypes.ARRAY(DataTypes.TEXT),
    accountId: DataTypes.STRING(32)
  }, {
    tableName : 'challenges',
    associate : function(models) {
      Challenge.hasMany(models.ChallengeRegistrant);
      Challenge.hasMany(models.Requirement, {through: models.ChallengeRequirement});
    }
  });

  return Challenge;

};
