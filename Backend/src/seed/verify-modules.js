/**
 * Verify and Fix Module Assignment in Roles
 * Run: node src/seed/verify-modules.js
 * 
 * This script checks all roles and ensures they have proper modules assigned
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Role } from '../models/role.model.js';

dotenv.config();

const main = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ABCD');
    console.log('✅ Connected');

    console.log('\n📋 Checking all roles...');
    const roles = await Role.find({ isDeleted: false });

    if (roles.length === 0) {
      console.log('❌ No roles found. Run seed:roles first.');
      process.exit(0);
    }

    let fixedCount = 0;
    let okCount = 0;

    for (const role of roles) {
      const hasModules = role.modules && role.modules.length > 0;
      const hasCorrectFormat = role.modules?.every(m => m.includes('_'));

      if (!hasModules) {
        console.log(`\n⚠️  Role "${role.name}" has NO modules - FIXING`);
        role.modules = ['module_1', 'module_2'];
        await role.save();
        fixedCount++;
        console.log(`   ✅ Fixed: modules set to ["module_1", "module_2"]`);
      } else if (!hasCorrectFormat) {
        console.log(`\n⚠️  Role "${role.name}" has OLD format - CONVERTING`);
        role.modules = role.modules.map(m => 
          String(m).replace(/^module([12])$/, 'module_$1')
        );
        await role.save();
        fixedCount++;
        console.log(`   ✅ Converted to: ${JSON.stringify(role.modules)}`);
      } else {
        console.log(`✅ Role "${role.name}" - OK: ${JSON.stringify(role.modules)}`);
        okCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ OK Roles: ${okCount}`);
    console.log(`   ⚠️  Fixed Roles: ${fixedCount}`);
    console.log(`   📈 Total: ${roles.length}`);

    if (fixedCount > 0) {
      console.log('\n✨ All roles have been fixed!');
    } else if (okCount === roles.length) {
      console.log('\n✨ All roles are already configured correctly!');
    }

    console.log('\n🧪 Test steps:');
    console.log('   1. Restart Backend: npm run dev');
    console.log('   2. Login to frontend');
    console.log('   3. Check browser console for module logs');
    console.log('   4. Module dropdown should show both Module 1 and Module 2');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main();
