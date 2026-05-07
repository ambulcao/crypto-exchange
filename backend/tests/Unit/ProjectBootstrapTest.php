<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ProjectBootstrapTest extends TestCase
{
    public function test_php_version_meets_project_requirement(): void
    {
        $this->assertTrue(version_compare(PHP_VERSION, '8.3.0', '>='));
    }
}
