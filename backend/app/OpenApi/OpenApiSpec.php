<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Crypto Exchange API',
    description: 'API para autenticacao, carteira, mercado e trade.'
)]
#[OA\Server(
    url: '/',
    description: 'Servidor local'
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Token'
)]
class OpenApiSpec
{
    #[OA\Get(
        path: '/up',
        summary: 'Health check da aplicacao',
        tags: ['Health']
    )]
    #[OA\Response(
        response: 200,
        description: 'Aplicacao em execucao'
    )]
    public function healthcheck(): void
    {
    }
}
