<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/register',
        summary: 'Registra um novo usuario',
        tags: ['Auth']
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['name', 'email', 'password', 'password_confirmation', 'accepted_terms'],
            properties: [
                new OA\Property(property: 'name', type: 'string', example: 'Alexandre'),
                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'alex@example.com'),
                new OA\Property(property: 'password', type: 'string', example: 'password123'),
                new OA\Property(property: 'password_confirmation', type: 'string', example: 'password123'),
                new OA\Property(property: 'accepted_terms', type: 'boolean', example: true),
            ]
        )
    )]
    #[OA\Response(response: 201, description: 'Usuario registrado com sucesso')]
    #[OA\Response(response: 422, description: 'Erro de validacao')]
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'accepted_terms' => ['required', 'accepted'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'accepted_terms_at' => now(),
        ]);

        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '10000.00000000',
            'balance_btc' => '0.00000000',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    #[OA\Post(
        path: '/api/login',
        summary: 'Realiza login com email e senha',
        tags: ['Auth']
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['email', 'password'],
            properties: [
                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'alex@example.com'),
                new OA\Property(property: 'password', type: 'string', example: 'password123'),
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Login realizado com sucesso')]
    #[OA\Response(response: 422, description: 'Credenciais invalidas')]
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Credenciais invalidas.',
                'errors' => [
                    'email' => ['Credenciais invalidas.'],
                ],
            ], 422);
        }

        /** @var User $user */
        $user = $request->user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    #[OA\Get(
        path: '/api/me',
        summary: 'Retorna dados do usuario autenticado',
        security: [['bearerAuth' => []]],
        tags: ['Auth']
    )]
    #[OA\Response(response: 200, description: 'Usuario autenticado retornado')]
    #[OA\Response(response: 401, description: 'Nao autenticado')]
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
