/**
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
'use strict';

/**
 * Defining ChallengeRequirement model.
 * It's the same with ChallengeRequirement model used in serenity-core,
 * but it adds hasMany relationship with ChallengeRegistrant model,
 * and remove the other unneeded relationships.
 *
 * Update:
 *    Removed the relationship with ChallengeRegistrant. Define the associate in Challenge.
 */
module.exports = function(sequelize, DataTypes) {

  var ChallengeRequirement = sequelize.define('ChallengeRequirement', {
    challengeId: DataTypes.INTEGER,
    requirementId: DataTypes.INTEGER
  }, {tableName: 'challenge_requirements'});

  return ChallengeRequirement;
};