<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bases criadas antes de accepted_terms_at existir em create_users precisam desta coluna.
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'accepted_terms_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('accepted_terms_at')->nullable()->after('email_verified_at');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'accepted_terms_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('accepted_terms_at');
        });
    }
};
